import { useEffect, useId, useState } from 'react'
import { formatDocumentDate } from '../services/documentDisplay'
import { getDocumentComments, postDocumentComment, setDocumentCommentLike } from '../services/libraryApi'
import { DocumentPagination } from './DocumentCards'

function useCommentPage(documentId, authenticated, parentId, enabled = true) {
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enabled) return
    let active = true
    getDocumentComments(documentId, page, { authenticated, parentId })
      .then(({ result: data }) => { if (active) setResult(data) })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [documentId, authenticated, parentId, enabled, page, revision])

  function changePage(nextPage) {
    setResult(null)
    setError('')
    setPage(nextPage)
  }

  function refresh(nextPage = page) {
    changePage(nextPage)
    setRevision((value) => value + 1)
  }

  return { page, result, error, changePage, refresh }
}

function CommentForm({ documentId, parentId, onPosted, onCancel }) {
  const inputId = useId()
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const label = parentId ? 'Nội dung trả lời' : 'Bình luận của bạn'

  async function submit(event) {
    event.preventDefault()
    if (!draft.trim() || posting) return
    setPosting(true)
    setError('')
    try {
      await postDocumentComment(documentId, draft.trim(), parentId)
      setDraft('')
      onPosted()
    } catch (err) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <form className="reader-comment-form" onSubmit={submit}>
      <label htmlFor={inputId}>{label}</label>
      <textarea id={inputId} disabled={posting} maxLength={2000} rows={3} value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={parentId ? 'Viết câu trả lời…' : 'Chia sẻ cảm nhận hoặc đặt câu hỏi về tài liệu…'} />
      <div className="reader-comment-form-actions">
        {onCancel && <button type="button" className="reader-button" disabled={posting} onClick={onCancel}>Hủy</button>}
        <button className="reader-button reader-button--primary" disabled={posting || !draft.trim()}>
          {posting ? 'Đang gửi…' : parentId ? 'Gửi trả lời' : 'Gửi bình luận'}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </form>
  )
}

function CommentItem({ documentId, comment, authenticated, loginLink, onReply }) {
  const [likes, setLikes] = useState(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const liked = likes?.liked ?? comment.liked ?? false
  const likeCount = likes?.likeCount ?? comment.likeCount ?? 0

  async function toggleLike() {
    if (pending) return
    setPending(true)
    setError('')
    try {
      const { result } = await setDocumentCommentLike(documentId, comment.id, !liked)
      setLikes(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="reader-comment">
      <span className="reader-avatar" aria-hidden="true">{comment.author.slice(0, 1)}</span>
      <div className="reader-comment-body">
        <header>
          <strong>{comment.author}</strong>
          <time dateTime={comment.createdAt}>{formatDocumentDate(comment.createdAt)}</time>
        </header>
        <p>{comment.body}</p>
        <div className="reader-comment-actions">
          {authenticated ? (
            <button type="button" aria-pressed={liked} disabled={pending} onClick={toggleLike}>
              {liked ? 'Đã thích' : 'Thích'} ({likeCount})
            </button>
          ) : <span>{loginLink('Thích')} ({likeCount})</span>}
          {onReply && (authenticated
            ? <button type="button" onClick={onReply}>Trả lời</button>
            : loginLink('Trả lời'))}
        </div>
        {error && <p role="alert">{error}</p>}
      </div>
    </div>
  )
}

function CommentPageStatus({ pagination, loading }) {
  if (pagination.error) return (
    <p role="alert">
      {pagination.error} <button type="button" onClick={() => pagination.refresh()}>Thử lại</button>
    </p>
  )
  return !pagination.result && <p role="status">{loading}</p>
}

function CommentThread({ documentId, comment, authenticated, loginLink }) {
  const [replying, setReplying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [addedReplies, setAddedReplies] = useState(0)
  const replyListId = useId()
  const replies = useCommentPage(documentId, authenticated, comment.id, expanded)
  const replyCount = replies.result?.total ?? (comment.replyCount ?? 0) + addedReplies

  return (
    <li>
      <CommentItem documentId={documentId} comment={comment} authenticated={authenticated} loginLink={loginLink}
        onReply={() => setReplying(true)} />
      {replying && authenticated && (
        <div className="reader-comment-thread">
          <CommentForm documentId={documentId} parentId={comment.id}
            onCancel={() => setReplying(false)}
            onPosted={() => {
              setReplying(false)
              setAddedReplies((value) => value + 1)
              setExpanded(true)
              replies.refresh(0)
            }} />
        </div>
      )}
      {replyCount > 0 && (
        <button type="button" className="reader-replies-toggle" aria-expanded={expanded}
          aria-controls={expanded ? replyListId : undefined} onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Ẩn trả lời' : `Xem ${replyCount} trả lời`}
        </button>
      )}
      {expanded && (
        <div className="reader-comment-thread" id={replyListId}>
          <CommentPageStatus pagination={replies} loading="Đang tải trả lời…" />
          {replies.result && (
            <>
              <ul className="reader-comments">
                {replies.result.items.map((reply) => (
                  <li key={reply.id}>
                    <CommentItem documentId={documentId} comment={reply} authenticated={authenticated} loginLink={loginLink} />
                  </li>
                ))}
              </ul>
              <DocumentPagination page={replies.page} hasNext={replies.result.hasNext} onChange={replies.changePage} />
            </>
          )}
        </div>
      )}
    </li>
  )
}

export default function DocumentComments({ documentId, authenticated, loginLink }) {
  const comments = useCommentPage(documentId, authenticated)

  return (
    <section className="reader-panel" aria-labelledby="document-comments-title">
      <h2 id="document-comments-title">Bình luận &amp; Thảo luận{comments.result ? ` (${comments.result.total})` : ''}</h2>
      {authenticated ? (
        <CommentForm documentId={documentId} onPosted={() => comments.refresh(0)} />
      ) : <p>{loginLink('Đăng nhập để bình luận')}</p>}
      <CommentPageStatus pagination={comments} loading="Đang tải bình luận…" />
      {comments.result && (
        <>
          {comments.result.items.length === 0 && <p>Chưa có bình luận.</p>}
          <ul className="reader-comments">
            {comments.result.items.map((comment) => (
              <CommentThread key={comment.id} documentId={documentId} comment={comment}
                authenticated={authenticated} loginLink={loginLink} />
            ))}
          </ul>
          <DocumentPagination page={comments.page} hasNext={comments.result.hasNext} onChange={comments.changePage} />
        </>
      )}
    </section>
  )
}
