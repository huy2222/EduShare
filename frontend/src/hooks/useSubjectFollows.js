import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getFollowedSubjectIds, setSubjectFollow } from '../services/subjectApi'

export default function useSubjectFollows({ authenticated, currentUser, notify }) {
  const navigate = useNavigate()
  const location = useLocation()
  const account = authenticated ? currentUser?.id || 'signed-in' : 'guest'
  const [state, setState] = useState(null)
  const [retry, setRetry] = useState(0)
  const [pending, setPending] = useState('')
  const saving = useRef(false)
  const activeAccount = useRef(account)
  activeAccount.current = account
  const ids = state?.account === account ? state.ids : null

  useEffect(() => {
    if (!authenticated) return
    let active = true
    setState(null)
    getFollowedSubjectIds().then(({ result }) => {
      if (active) setState({ account, ids: result })
    }).catch((error) => { if (active) setState({ account, error: error.message }) })
    return () => { active = false }
  }, [authenticated, account, retry])

  async function toggle(id) {
    if (!authenticated) {
      navigate('/login', { state: { returnTo: location.pathname + location.search } })
      return
    }
    if (!ids || saving.current) return
    saving.current = true
    setPending(id)
    try {
      const { result } = await setSubjectFollow(id, !ids.includes(id))
      if (activeAccount.current !== account) return
      setState({ account, ids: result.followed ? [...ids.filter((item) => item !== id), id] : ids.filter((item) => item !== id) })
      notify(result.followed ? 'Đã theo dõi môn học.' : 'Đã bỏ theo dõi môn học.')
      return result
    } catch (error) {
      if (activeAccount.current === account) notify(error.message, true)
    } finally {
      saving.current = false
      setPending('')
    }
  }

  return { ids: ids || [], ready: !authenticated || Boolean(ids), pending, toggle,
    error: state?.account === account ? state.error : '', reload: () => setRetry((value) => value + 1) }
}
