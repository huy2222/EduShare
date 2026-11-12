import { useEffect, useState } from "react";
import {
  AdminIcon,
  LoadingOverlay,
  Modal,
  Pagination,
  formatAdminNumber,
} from "../components/AdminUi";
import {
  getModerationDocuments,
  getModerationStats,
  getModerationDocument,
  getModerationDocumentPreview,
  exportModerationDocuments,
  moderateDocument,
} from "../services/adminApi";

const moderationStatusLabels = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị chặn",
  DELETED: "Đã ẩn",
};

const moderationDocumentTypeLabels = {
  LECTURE_NOTE: "Bài giảng",
  TEXTBOOK: "Giáo trình",
  REFERENCE: "Tham khảo",
  EXAM: "Đề thi",
  SOLUTION: "Đáp án",
  ASSIGNMENT: "Bài tập",
  PROJECT: "Đồ án",
  SUMMARY: "Tóm tắt",
  OTHER: "Khác",
};

const moderationFileTypeLabels = {
  pdf: "PDF",
  doc: "Word",
  docx: "Word",
  xls: "Excel",
  xlsx: "Excel",
  ppt: "PowerPoint",
  pptx: "PowerPoint",
  txt: "TXT",
};

const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(index ? 1 : 0)} ${units[index]}`;
};

const normalizeModerationDocument = (item) => ({
  id: item.id,
  title: item.title,
  description:
    item.description ||
    `${item.subjectCode || ""} ${item.subjectName || ""}`.trim(),
  uploader: item.uploaderName || "Chưa cập nhật",
  email: item.uploaderEmail || "—",
  faculty: item.facultyName || "—",
  major: item.majorName || "—",
  subject: item.subjectName || "—",
  subjectCode: item.subjectCode || "",
  time: item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "—",
  size: formatFileSize(item.fileSize),
  scan: item.scanStatus,
  status: item.status,
  type: (item.fileType || "file").toLowerCase(),
  previewStatus: item.previewStatus || "NOT_REQUIRED",
  previewError: item.previewError || "",
  fileName: item.fileName,
  objectKey: item.objectKey,
  views: item.viewCount || 0,
  downloads: item.downloadCount || 0,
  documentType: item.documentType || "OTHER",
  raw: item,
});

export default function AdminDocumentsPage({ mode = "management" }) {
  const isModeration = mode === "moderation";
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    isModeration ? "PENDING" : "",
  );
  const [typeFilter, setTypeFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [rejectRequest, setRejectRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [moderating, setModerating] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setPreviewUrl("");
    const canLoadPreview =
      detail &&
      (detail.type === "pdf" ||
        ((detail.type === "doc" || detail.type === "docx") &&
          detail.previewStatus === "AVAILABLE"));
    if (!canLoadPreview) return undefined;
    getModerationDocumentPreview(detail.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setPreviewUrl(objectUrl);
      })
      .catch(
        (requestError) =>
          active &&
          setError(`Không thể tải bản xem trước: ${requestError.message}`),
      );
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [detail]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
    setLoading(true);
    Promise.all([
      getModerationDocuments({
        page,
        size: 10,
        search: query.trim(),
        status: isModeration ? "PENDING" : statusFilter,
        fileType: typeFilter.toUpperCase(),
        createdFrom:
          periodFilter === "month"
            ? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                .toLocaleDateString("en-CA")
            : "",
      }),
      getModerationStats(),
    ])
      .then(([response, statsResponse]) => {
        if (active) {
          setDocuments(
            (response.result?.items || []).map(normalizeModerationDocument),
          );
          setTotal(response.result?.totalElements || 0);
          setStats(statsResponse.result);
          setError("");
        }
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    }, query ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [reload, page, query, statusFilter, typeFilter, periodFilter]);

  const visible = documents;
  const selectable = visible.filter(
    (document) => document.status === "PENDING" && document.scan === "CLEAN",
  );
  const allSelected =
    selectable.length > 0 &&
    selectable.every((item) => selected.includes(item.id));
  const pendingCount = stats?.pending;
  const formatStat = (value) =>
    value == null ? "—" : value.toLocaleString("vi-VN");

  const toggleSelected = (id) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  const updateStatus = async (ids, status, reason = "") => {
    if (!ids.length) return;
    setModerating(true);
    setBusyAction(
      status === "APPROVED"
        ? "Đang phê duyệt tài liệu…"
        : status === "HIDDEN"
          ? "Đang ẩn tài liệu…"
          : "Đang từ chối tài liệu…",
    );
    try {
      await Promise.all(ids.map((id) => moderateDocument(id, status, reason)));
      setSelected([]);
      setDetail(null);
      setRejectRequest(null);
      setRejectReason("");
      setRejectError("");
      setNotice(
        status === "APPROVED"
          ? "Đã duyệt tài liệu đã chọn."
          : status === "HIDDEN"
            ? "Đã ẩn tài liệu đã chọn."
            : "Đã từ chối tài liệu đã chọn.",
      );
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setModerating(false);
      setBusyAction("");
    }
  };

  const openRejectDialog = (ids, label, action = "REJECTED") => {
    if (!ids.length) return;
    setRejectReason("");
    setRejectError("");
    setRejectRequest({ ids, label, action });
  };

  const submitRejection = (event) => {
    event.preventDefault();
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError("Vui lòng nhập lý do từ chối tài liệu.");
      return;
    }
    updateStatus(rejectRequest.ids, rejectRequest.action, reason);
  };

  const exportReport = async () => {
    setBusyAction("Đang tạo báo cáo tài liệu…");
    try {
      const blob = await exportModerationDocuments({
        search: query.trim(), status: isModeration ? "PENDING" : statusFilter, fileType: typeFilter.toUpperCase(),
        createdFrom: periodFilter === "month" ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString("en-CA") : "",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bao-cao-tai-lieu-${new Date().toLocaleDateString("en-CA")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(`Không thể xuất báo cáo: ${requestError.message}`);
    } finally {
      setBusyAction("");
    }
  };

  const openDocumentDetail = async (document) => {
    setBusyAction(
      isModeration
        ? "Đang mở màn hình kiểm duyệt…"
        : "Đang tải chi tiết tài liệu…",
    );
    try {
      const response = await getModerationDocument(document.id);
      setDetail(normalizeModerationDocument(response.result));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyAction("");
    }
  };

  return (
    <div className="admin-moderation">
      {(busyAction || loading) && (
        <LoadingOverlay
          message={busyAction || "Đang tải danh sách tài liệu…"}
        />
      )}
      {!isModeration && (
        <div className="admin-document-actions">
          <button type="button" onClick={exportReport} disabled={!visible.length || Boolean(busyAction)}>⇩ Xuất báo cáo</button>
        </div>
      )}
      <div className="admin-moderation-stats">
        <article>
          <div>
            <small>{isModeration ? "Chờ phê duyệt" : "Tổng tài liệu"}</small>
            <strong>{formatStat(isModeration ? stats?.pending : stats?.total)}</strong>
          </div>
          <span>▣</span>
        </article>
        <article>
          <div>
            <small>{isModeration ? "Đã duyệt hôm nay" : "Đã duyệt"}</small>
            <strong className="is-blue">
              {formatStat(isModeration ? stats?.approvedToday : stats?.approved)}
            </strong>
          </div>
          <span>✓</span>
        </article>
        <article>
          <div>
            <small>{isModeration ? "Từ chối hôm nay" : "Chờ duyệt"}</small>
            <strong className={isModeration ? "is-red" : ""}>{formatStat(isModeration ? stats?.rejectedToday : stats?.pending)}</strong>
          </div>
          <span>×</span>
        </article>
        <article>
          <div>
            <small>{isModeration ? "Tổng tài liệu" : "Bị từ chối"}</small>
            <strong className={isModeration ? "" : "is-red"}>{formatStat(isModeration ? stats?.total : stats?.rejected)}</strong>
          </div>
          <span>▤</span>
        </article>
      </div>
      <section className="admin-moderation-panel">
        <div className="admin-moderation-toolbar">
          <div className="admin-moderation-filters">
            <label className="admin-moderation-search">
              <AdminIcon name="search" />
              <input
                aria-label="Tìm kiếm tài liệu, người tải"
                placeholder="Tìm kiếm tên tài liệu, người tải…"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(0); }}
              />
            </label>
            {!isModeration && (
              <select
                aria-label="Lọc trạng thái tài liệu"
                value={statusFilter}
                onChange={(event) => { setStatusFilter(event.target.value); setPage(0); }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ phê duyệt ({formatStat(pendingCount)})</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Bị chặn</option>
                <option value="DELETED">Đã ẩn</option>
              </select>
            )}
            <select
              aria-label="Lọc định dạng"
              value={typeFilter}
              onChange={(event) => { setTypeFilter(event.target.value); setPage(0); }}
            >
              <option value="">Tất cả định dạng</option>
              <option value="pdf">PDF</option>
              <option value="doc">Word (.doc)</option>
              <option value="docx">Word (.docx)</option>
              <option value="xls">Excel (.xls)</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="ppt">PowerPoint (.ppt)</option>
              <option value="pptx">PowerPoint (.pptx)</option>
              <option value="txt">TXT</option>
            </select>
            <select aria-label="Lọc thời gian" value={periodFilter} onChange={(event) => { setPeriodFilter(event.target.value); setPage(0); }}>
              <option value="">Mọi thời gian</option>
              <option value="month">Tháng này</option>
            </select>
          </div>
          {isModeration && <div className="admin-moderation-bulk-actions">
            <span className="admin-selected-count">
              {selected.length
                ? `Đã chọn ${selected.length}`
                : "Chưa chọn tài liệu"}
            </span>
            <button
              type="button"
              onClick={() =>
                openRejectDialog(
                  selected,
                  `${selected.length} tài liệu đã chọn`,
                )
              }
              disabled={!selected.length}
            >
              Từ chối
            </button>
            <button
              className="admin-primary"
              type="button"
              onClick={() => updateStatus(selected, "APPROVED")}
              disabled={!selected.length || moderating}
            >
              Duyệt đã chọn
            </button>
          </div>}
        </div>
        {notice && (
          <p className="admin-success" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="admin-error" role="alert">
            {error}{" "}
            <button
              type="button"
              onClick={() => setReload((value) => value + 1)}
            >
              Thử lại
            </button>
          </p>
        )}
        <div className="admin-moderation-table-scroll">
          <table className={`admin-moderation-table${isModeration ? "" : " is-management"}`}>
            <thead>
              <tr>
                {isModeration && <th>
                  <input
                    aria-label="Chọn tất cả tài liệu an toàn"
                    type="checkbox"
                    checked={allSelected}
                    onChange={() =>
                      setSelected(
                        allSelected ? [] : selectable.map((item) => item.id),
                      )
                    }
                  />
                </th>}
                <th>TÀI LIỆU</th>
                <th>NGƯỜI TẢI</th>
                <th className="admin-visually-hidden">KHOA</th>
                <th className="admin-visually-hidden">NGÀNH</th>
                <th>MÔN HỌC</th>
                <th>LOẠI TÀI LIỆU</th>
                <th>TRẠNG THÁI</th>
                <th>TƯƠNG TÁC</th>
                <th>NGÀY TẢI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isModeration ? 11 : 10} className="admin-empty">
                    {isModeration ? "Đang tải tài liệu chờ duyệt…" : "Đang tải danh sách tài liệu…"}
                  </td>
                </tr>
              ) : visible.length ? (
                visible.map((document) => {
                  const canApprove =
                    document.status === "PENDING" && document.scan === "CLEAN";
                  return (
                    <tr
                      key={document.id}
                      className={
                        document.scan === "INFECTED" ? "is-infected" : ""
                      }
                    >
                      {isModeration && <td>
                        <input
                          aria-label={`Chọn ${document.title}`}
                          type="checkbox"
                          checked={selected.includes(document.id)}
                          disabled={!canApprove}
                          onChange={() => toggleSelected(document.id)}
                        />
                      </td>}
                      <td>
                        <div className="moderation-document">
                          <span
                            className={`moderation-file-type-badge ${document.type}`}
                          >
                            {moderationFileTypeLabels[document.type] ||
                              document.type.toUpperCase()}
                          </span>
                          <b>{document.title}</b>
                        </div>
                      </td>
                      <td>
                        <div className="moderation-uploader">
                          <b>{document.uploader}</b>
                          <small>{document.email}</small>
                        </div>
                      </td>
                      <td className="admin-visually-hidden">{document.faculty}</td>
                      <td className="admin-visually-hidden">{document.major}</td>
                      <td className="moderation-academic-cell"><b>{document.subject}</b><small>{document.subjectCode}</small></td>
                      <td><span className="admin-badge">{moderationDocumentTypeLabels[document.documentType] || document.documentType}</span></td>
                      <td>
                        <span
                          className={`moderation-pill status-${document.status.toLowerCase()}`}
                        >
                          {moderationStatusLabels[document.status]}
                        </span>
                      </td>
                      <td className="moderation-interactions">◉ {formatAdminNumber(document.views)} &nbsp; ⇩ {formatAdminNumber(document.downloads)}</td>
                      <td>{document.time}</td>
                      <td>
                        <button
                          className="moderation-action"
                          type="button"
                          onClick={() => openDocumentDetail(document)}
                          disabled={Boolean(busyAction)}
                        >
                          {isModeration ? "Kiểm duyệt" : "Chi tiết"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isModeration ? 11 : 10} className="admin-empty">
                    Không tìm thấy tài liệu phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} size={10} onChange={setPage} />
      </section>
      {detail && (
        <div className="moderation-detail-backdrop" role="presentation">
          <section
            className="moderation-detail-screen"
            role="dialog"
            aria-modal="true"
            aria-labelledby="moderation-detail-title"
          >
            <header className="moderation-detail-header">
              <button
                type="button"
                className="moderation-back-button"
                onClick={() => setDetail(null)}
              >
                ← Quay lại danh sách
              </button>
              <span className="moderation-detail-divider">/</span>
              <h2 id="moderation-detail-title">{detail.title}</h2>
              <span
                className={`moderation-pill status-${detail.status.toLowerCase()}`}
              >
                {detail.status === "APPROVED"
                  ? "● Đã duyệt"
                  : detail.status === "REJECTED"
                    ? "● Bị chặn"
                    : "● Chờ duyệt"}
              </span>
              <button
                type="button"
                className="moderation-close-button"
                aria-label="Đóng chi tiết"
                onClick={() => setDetail(null)}
              >
                ×
              </button>
            </header>
            <div className="moderation-detail-body">
              <main className="moderation-document-viewer">
                <div className="moderation-viewer-canvas">
                  {detail.type === "pdf" ||
                  ((detail.type === "doc" || detail.type === "docx") &&
                    detail.previewStatus === "AVAILABLE") ? (
                    previewUrl ? (
                      <iframe
                        title={`Xem trước ${detail.title}`}
                        src={previewUrl}
                      />
                    ) : (
                      <div className="moderation-preview-placeholder">
                        <span>…</span>
                        <b>Đang tải bản xem trước…</b>
                        <small>
                          Đang lấy bản PDF an toàn từ Cloudflare R2.
                        </small>
                      </div>
                    )
                  ) : detail.previewStatus === "PENDING" ||
                    detail.previewStatus === "CONVERTING" ? (
                    <div className="moderation-preview-placeholder">
                      <span>…</span>
                      <b>Đang tạo bản xem trước PDF</b>
                      <small>
                        LibreOffice đang chuyển đổi tệp Word sau khi quét virus.
                      </small>
                    </div>
                  ) : detail.previewStatus === "FAILED" ? (
                    <div className="moderation-preview-placeholder">
                      <span>!</span>
                      <b>Chưa tạo được bản xem trước</b>
                      <small>
                        {detail.previewError ||
                          "Vui lòng tải tệp gốc để kiểm tra."}
                      </small>
                    </div>
                  ) : (
                    <div className="moderation-preview-placeholder">
                      <span>▤</span>
                      <b>{detail.fileName}</b>
                      <small>
                        Định dạng này chưa có chế độ xem trước trong trình
                        duyệt.
                      </small>
                    </div>
                  )}
                </div>
              </main>
              <aside className="moderation-info-column">
                <section className="moderation-info-card">
                  <h3>▣ &nbsp;Thông tin tệp</h3>
                  <dl>
                    <dt>Tên tệp</dt>
                    <dd>{detail.fileName}</dd>
                    <dt>Định dạng</dt>
                    <dd>
                      <span className="moderation-file-type">
                        ▤ {detail.type.toUpperCase()}
                      </span>
                    </dd>
                    <dt>Dung lượng</dt>
                    <dd>{detail.size}</dd>
                    <dt>Môn học</dt>
                    <dd>
                      {detail.raw?.subjectCode} · {detail.raw?.subjectName}
                    </dd>
                    <dt>Ngày tải</dt>
                    <dd>{detail.time}</dd>
                  </dl>
                </section>
                <section className="moderation-info-card">
                  <h3>♙ &nbsp;Người tải lên</h3>
                  <dl>
                    <dt>Họ và tên</dt>
                    <dd>{detail.uploader}</dd>
                    <dt>Email</dt>
                    <dd>{detail.email}</dd>
                    <dt>Khoa / lớp</dt>
                    <dd>{detail.raw?.facultyName || "—"}</dd>
                  </dl>
                </section>
                {isModeration && <section className="moderation-info-actions" aria-label="Thao tác kiểm duyệt">
                  <button
                    type="button"
                    className="moderation-reject-button"
                    onClick={() => openRejectDialog([detail.id], detail.title)}
                    disabled={detail.status !== "PENDING" || moderating}
                  >
                    Từ chối
                  </button>
                  {detail.status === "APPROVED" && (
                    <button type="button" className="moderation-reject-button" onClick={() => openRejectDialog([detail.id], detail.title, "HIDDEN")} disabled={moderating}>Ẩn tài liệu</button>
                  )}
                  <button
                    type="button"
                    className="admin-primary moderation-approve-button"
                    onClick={() => updateStatus([detail.id], "APPROVED")}
                    disabled={
                      detail.status !== "PENDING" ||
                      detail.scan !== "CLEAN" ||
                      moderating
                    }
                  >
                    Phê duyệt
                  </button>
                </section>}
              </aside>
            </div>
          </section>
        </div>
      )}
      {rejectRequest && (
        <Modal
          title={rejectRequest.action === "HIDDEN" ? "Lý do ẩn tài liệu" : "Lý do từ chối tài liệu"}
          onClose={() => setRejectRequest(null)}
          busy={moderating}
        >
          <form className="moderation-reject-form" onSubmit={submitRejection}>
            <p>
              Bạn đang {rejectRequest.action === "HIDDEN" ? "ẩn" : "từ chối"} <strong>{rejectRequest.label}</strong>. Lý do này
              sẽ được lưu vào lịch sử kiểm duyệt.
            </p>
            <label htmlFor="moderation-reject-reason">
              Lý do từ chối <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="moderation-reject-reason"
              autoFocus
              rows="5"
              maxLength="1000"
              placeholder="Ví dụ: Nội dung không đúng môn học, tài liệu vi phạm bản quyền…"
              value={rejectReason}
              onChange={(event) => {
                setRejectReason(event.target.value);
                if (rejectError) setRejectError("");
              }}
              aria-describedby="moderation-reject-help moderation-reject-error"
              aria-invalid={Boolean(rejectError)}
            />
            <div className="moderation-reject-meta">
              <small id="moderation-reject-help">
                Nhập lý do cụ thể để người tải có thể điều chỉnh tài liệu.
              </small>
              <small>{rejectReason.length}/1000</small>
            </div>
            {rejectError && (
              <p
                className="moderation-reject-error"
                id="moderation-reject-error"
                role="alert"
              >
                {rejectError}
              </p>
            )}
            <div className="admin-modal-actions">
              <button
                type="button"
                onClick={() => setRejectRequest(null)}
                disabled={moderating}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="moderation-confirm-reject"
                disabled={moderating || !rejectReason.trim()}
              >
                {moderating ? "Đang xử lý…" : rejectRequest.action === "HIDDEN" ? "Xác nhận ẩn" : "Xác nhận từ chối"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
