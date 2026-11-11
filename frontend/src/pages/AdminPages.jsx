import { hasPermission, sectionPermissions } from "../services/adminAccess";
import AdminAccess from "../components/AdminAccess";
import Catalog from "../components/AdminCatalog";
import { LoadingOverlay, Modal, Pagination } from "../components/AdminUi";
import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../services/authApi";
import {
  getOverview,
  getRoles,
  getUsers,
  getModerationDocuments,
  getModerationStats,
  getModerationDocument,
  getModerationDocumentPreview,
  exportModerationDocuments,
  moderateDocument,
  updateUser,
} from "../services/adminApi";
import brandMark from "../assets/brand-mark.svg";
import "../styles/admin.css";

const sections = {
  overview: "Tổng quan",
  documents: "Quản lý tài liệu",
  moderation: "Kiểm duyệt tài liệu",
  users: "Quản lý người dùng",
  faculties: "Khoa & ngành",
  subjects: "Quản lý môn học",
  access: "Phân quyền & vai trò",
};
const roleLabel = (role) =>
  ({
    ADMIN: "Quản trị viên",
    USER: "Người dùng",
    MODERATOR: "Kiểm duyệt viên",
    LECTURER: "Giảng viên",
  })[role] || role;
const statuses = {
  ACTIVE: "Đang hoạt động",
  BANNED: "Đã khoá",
  INACTIVE: "Ngừng hoạt động",
  PENDING_VERIFICATION: "Chờ xác thực",
};
const number = (value) => (value || 0).toLocaleString("vi-VN");

function Icon({ name }) {
  const paths = {
    access: (
      <>
        <path d="M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5" />
      </>
    ),
    faculties: (
      <>
        <path d="M3 21h18M5 21V6l7-3 7 3v15M9 8h1m4 0h1M9 12h1m4 0h1M10 21v-5h4v5" />
      </>
    ),
    subjects: (
      <>
        <path d="M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1v16" />
      </>
    ),
    documents: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    moderation: (
      <>
        <path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    arrow: <path d="M19 12H5m6-6-6 6 6 6" />,
    search: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="m15 15 6 6" />
      </>
    ),
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.subjects}
    </svg>
  );
}

function Stats({ data }) {
  return (
    <div className="admin-stats">
      {[
        ["users", "Tổng người dùng"],
        ["faculties", "Khoa đào tạo"],
        ["subjects", "Môn học"],
        ["documents", "Tổng tài liệu"],
      ].map(([key, label]) => (
        <article key={key} className="admin-stat">
          <div>
            <p>{label}</p>
            <strong>{number(data[key])}</strong>
            <small>Dữ liệu trong hệ thống</small>
          </div>
          <span className={`admin-stat-icon ${key}`}>
            <Icon name={key} />
          </span>
        </article>
      ))}
    </div>
  );
}

function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    getOverview()
      .then((r) => {
        if (active) {
          setData(r.result);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  if (error)
    return (
      <p role="alert">
        {error} <button onClick={() => setRetry((v) => v + 1)}>Thử lại</button>
      </p>
    );
  if (!data) return <p role="status">Đang tải tổng quan…</p>;
  const activePercent = data.users
    ? Math.round((data.activeUsers / data.users) * 100)
    : 0;
  return (
    <>
      <Stats data={data} />
      <div className="admin-overview-grid">
        <section className="admin-panel">
          <h2>Trạng thái tài khoản</h2>
          <p className="admin-muted">
            Theo dõi tình hình người dùng trên EduShare.
          </p>
          <div className="admin-account-summary">
            <strong>
              {activePercent}
              <small>%</small>
            </strong>
            <span>tài khoản đang hoạt động</span>
          </div>
          <div className="admin-progress">
            <span style={{ width: `${activePercent}%` }} />
          </div>
          <div className="admin-status-list">
            <p>
              <span>Đang hoạt động</span>
              <b>{number(data.activeUsers)}</b>
            </p>
            <p>
              <span>Đã khoá / ngừng hoạt động</span>
              <b>{number(data.lockedUsers)}</b>
            </p>
            <p>
              <span>Chờ xác thực</span>
              <b>{number(data.users - data.activeUsers - data.lockedUsers)}</b>
            </p>
          </div>
          <Link className="admin-text-link" to="/admin/users">
            Xem danh sách người dùng →
          </Link>
        </section>
        <section className="admin-panel">
          <h2>Thao tác nhanh</h2>
          <p className="admin-muted">Truy cập các chức năng quản trị.</p>
          {["users", "faculties", "subjects"].map((key) => (
            <Link className="admin-quick-link" key={key} to={`/admin/${key}`}>
              <span className="admin-stat-icon">
                <Icon name={key} />
              </span>
              <div>
                <b>{sections[key]}</b>
                <small>
                  {key === "users"
                    ? "Phân quyền và trạng thái tài khoản"
                    : key === "faculties"
                      ? "Quản lý khoa và các ngành trực thuộc"
                      : "Thêm và sắp xếp môn học theo khoa"}
                </small>
              </div>
              <span>→</span>
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}

function Users({ currentUser }) {
  const isAdmin = currentUser.roles?.includes("ADMIN");
  const canAssign =
    isAdmin || currentUser.permissions?.includes("USER_ROLE_ASSIGN");
  const canBan = isAdmin || currentUser.permissions?.includes("USER_BAN");
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    page: 0,
  });
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    getRoles()
      .then((r) => {
        if (active) setRoles(r.result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [reload]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(
      () =>
        getUsers(filters)
          .then((r) => {
            if (active) {
              setData(r.result);
              setError("");
            }
          })
          .catch((e) => {
            if (active) setError(e.message);
          })
          .finally(() => {
            if (active) setLoading(false);
          }),
      filters.search ? 250 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters, reload]);
  const filter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, page: 0 }));
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setModalError("");
    try {
      await updateUser(editing.id, {
        roles: editing.roles,
        status: editing.status,
      });
      setEditing(null);
      setNotice("Đã cập nhật tài khoản.");
      setReload((v) => v + 1);
    } catch (e) {
      setModalError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="admin-toolbar">
        <label className="admin-search">
          <Icon name="search" />
          <input
            aria-label="Tìm người dùng"
            placeholder="Tìm theo tên hoặc email…"
            value={filters.search}
            onChange={(e) => filter("search", e.target.value)}
          />
        </label>
        <select
          aria-label="Lọc vai trò"
          value={filters.role}
          onChange={(e) => filter("role", e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc trạng thái"
          value={filters.status}
          onChange={(e) => filter("status", e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statuses).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            setFilters({ search: "", role: "", status: "", page: 0 })
          }
        >
          Đặt lại
        </button>
      </div>
      {notice && (
        <p className="admin-success" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}{" "}
          <button onClick={() => setReload((v) => v + 1)}>Thử lại</button>
        </p>
      )}
      <section className="admin-table-panel">
        <div className="admin-table-title">
          <h2>Danh sách người dùng</h2>
          <span>
            {loading ? "Đang tải…" : `${number(data.totalElements)} tài khoản`}
          </span>
        </div>
        <div className="admin-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email / tài khoản</th>
                <th>Vai trò</th>
                <th>Ngày tham gia</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="admin-empty">
                    Đang tải người dùng…
                  </td>
                </tr>
              ) : error ? null : data.content.length ? (
                data.content.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-person">
                        <span className="admin-avatar">
                          {(user.fullName || user.email)
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>
                        <b>
                          {user.fullName || "Chưa cập nhật"}
                          {user.id === currentUser.id && (
                            <small>Tài khoản của bạn</small>
                          )}
                        </b>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {user.roles.map((r) => (
                        <span key={r} className="admin-badge">
                          {roleLabel(r)}
                        </span>
                      ))}
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <span className={`admin-badge status-${user.status}`}>
                        {statuses[user.status]}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setEditing({ ...user });
                          setModalError("");
                        }}
                      >
                        Xem / chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="admin-empty">
                    Không tìm thấy người dùng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <Pagination
            page={filters.page}
            total={data.totalElements}
            onChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        )}
      </section>
      {editing && (
        <Modal
          title="Thông tin người dùng"
          busy={busy}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <div className="admin-user-details">
              <b>{editing.fullName || "Chưa cập nhật tên"}</b>
              <p>{editing.email}</p>
              <small>
                Tham gia:{" "}
                {new Date(editing.createdAt).toLocaleDateString("vi-VN")}
              </small>
            </div>
            <fieldset
              disabled={busy || editing.id === currentUser.id || !canAssign}
            >
              <legend>Phân quyền</legend>
              {[...new Set([...roles, ...editing.roles])].map((role) => (
                <label className="admin-checkbox" key={role}>
                  <input
                    type="checkbox"
                    checked={editing.roles.includes(role)}
                    onChange={(e) =>
                      setEditing((u) => ({
                        ...u,
                        roles: e.target.checked
                          ? [...u.roles, role]
                          : u.roles.filter((r) => r !== role),
                      }))
                    }
                  />
                  {roleLabel(role)}
                </label>
              ))}
            </fieldset>
            <label className="admin-field">
              Trạng thái
              <select
                disabled={
                  busy ||
                  !canBan ||
                  editing.id === currentUser.id ||
                  editing.status === "PENDING_VERIFICATION"
                }
                value={editing.status}
                onChange={(e) =>
                  setEditing((u) => ({ ...u, status: e.target.value }))
                }
              >
                {Object.entries(statuses)
                  .filter(
                    ([key]) =>
                      key !== "PENDING_VERIFICATION" || editing.status === key,
                  )
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>
            {editing.id === currentUser.id && (
              <p className="admin-muted">
                Không thể tự thay đổi quyền hoặc khoá tài khoản đang sử dụng.
              </p>
            )}
            {modalError && (
              <p role="alert" className="admin-error">
                {modalError}
              </p>
            )}
            <div className="admin-modal-actions">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Đóng
              </button>
              <button
                className="admin-primary"
                disabled={
                  busy ||
                  editing.id === currentUser.id ||
                  !editing.roles.length ||
                  (!canAssign && !canBan)
                }
              >
                {busy ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function AcademicManagement({ currentUser }) {
  const [tab, setTab] = useState("faculties");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  return (
    <>
      <div
        className="admin-catalog-tabs"
        role="group"
        aria-label="Danh mục đào tạo"
      >
        <button
          aria-pressed={tab === "faculties"}
          onClick={() => setTab("faculties")}
        >
          Khoa
        </button>
        <button
          aria-pressed={tab === "majors"}
          onClick={() => {
            setSelectedFaculty("");
            setTab("majors");
          }}
        >
          Ngành
        </button>
      </div>
      <Catalog
        key={tab}
        currentUser={currentUser}
        type={tab}
        initialFacultyId={selectedFaculty}
        onViewMajors={(id) => {
          setSelectedFaculty(id);
          setTab("majors");
        }}
      />
    </>
  );
}

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

function DocumentModeration({ mode = "management" }) {
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
              <Icon name="search" />
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
                      <td className="moderation-interactions">◉ {number(document.views)} &nbsp; ⇩ {number(document.downloads)}</td>
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

export default function AdminPages({
  onLogout,
  currentUser,
  authLoading = false,
}) {
  const { section = "overview" } = useParams();
  const [user, setUser] = useState(currentUser || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    if (currentUser !== undefined) {
      setUser(currentUser);
      setLoading(authLoading);
      setError(!authLoading && !currentUser ? "login" : "");
      return;
    }
    let active = true;
    getCurrentUser()
      .then((r) => {
        if (active) setUser(r.result);
      })
      .catch((e) => {
        if (active) setError(e.status === 401 ? "login" : e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser, authLoading]);
  if (loading)
    return (
      <main className="admin-access" role="status">
        Đang kiểm tra quyền truy cập…
      </main>
    );
  if (error === "login") return <Navigate to="/login" replace />;
  const isAdmin = user?.roles?.includes("ADMIN");
  const allowed = (key) =>
    hasPermission(user, ...(sectionPermissions[key] || []));
  const visible = Object.entries(sections).filter(([key]) => allowed(key));
  if (error || !visible.length)
    return (
      <main className="admin-access">
        <h1>{error || "Bạn không có quyền quản trị"}</h1>
        <Link to="/">Về trang chủ</Link>
      </main>
    );
  if (!sections[section] || !allowed(section))
    return (
      <Navigate
        to={visible[0][0] === "overview" ? "/admin" : "/admin/" + visible[0][0]}
        replace
      />
    );
  return (
    <div className={`admin-app${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin">
          <img src={brandMark} alt="" />
          EduShare <span>ADMIN</span>
        </Link>
        <p className="admin-nav-label">KHÔNG GIAN QUẢN TRỊ</p>
        <nav aria-label="Quản trị">
          {visible.map(([key, label]) => (
            <NavLink
              end={key === "overview"}
              to={key === "overview" ? "/admin" : `/admin/${key}`}
              key={key}
            >
              <Icon name={key} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link to="/">
            <Icon name="arrow" />
            Về trang chủ
          </Link>
          <button onClick={onLogout}>Đăng xuất</button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-sidebar-toggle"
            aria-label={
              sidebarCollapsed ? "Mở thanh điều hướng" : "Ẩn thanh điều hướng"
            }
            title={
              sidebarCollapsed ? "Mở thanh điều hướng" : "Ẩn thanh điều hướng"
            }
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          >
            {sidebarCollapsed ? "☰" : "←"}
          </button>
          <span>Admin Workspace</span>
          <div>
            <span className="admin-avatar">
              {(user.fullName || "A").slice(0, 1)}
            </span>
            <div>
              <b>{user.fullName || "Quản trị viên"}</b>
              <small>Quản trị hệ thống</small>
            </div>
          </div>
        </header>
        <main className="admin-main">
          <div className="admin-heading">
            <p>QUẢN TRỊ / {sections[section].toLocaleUpperCase("vi")}</p>
            <h1>{sections[section]}</h1>
            <span>
              {section === "overview"
                ? "Chào mừng trở lại! Cùng theo dõi hệ thống EduShare."
                : section === "users"
                  ? "Quản lý tài khoản, vai trò và quyền truy cập hệ thống."
                  : section === "access"
                    ? "Quản lý vai trò, cấu hình quyền và phân quyền người dùng."
                    : section === "documents"
                      ? "Tổng hợp, tìm kiếm và theo dõi toàn bộ tài liệu trong hệ thống."
                    : section === "moderation"
                      ? "Xử lý hàng chờ, kiểm tra nội dung và phê duyệt tài liệu mới."
                      : "Quản lý danh mục đào tạo và tổ chức tài liệu học tập."}
            </span>
          </div>
          {section === "overview" ? (
            <Overview />
          ) : section === "documents" ? (
            <DocumentModeration key="management" mode="management" />
          ) : section === "moderation" ? (
            <DocumentModeration key="moderation" mode="moderation" />
          ) : section === "users" ? (
            <Users currentUser={user} />
          ) : section === "access" ? (
            <AdminAccess
              currentUser={user}
              renderUsers={() => <Users currentUser={user} />}
            />
          ) : section === "faculties" ? (
            <AcademicManagement currentUser={user} />
          ) : (
            <Catalog key={section} type={section} currentUser={user} />
          )}
          <footer className="admin-footer">
            EduShare · Không gian quản trị
          </footer>
        </main>
      </div>
    </div>
  );
}
