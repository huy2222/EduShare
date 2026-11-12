import { useEffect, useState } from "react";
import { AdminIcon, Modal, Pagination, formatAdminNumber } from "../components/AdminUi";
import { getRoles, getUsers, updateUser } from "../services/adminApi";

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

export default function AdminUsersPage({ currentUser }) {
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
          <AdminIcon name="search" />
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
            {loading ? "Đang tải…" : `${formatAdminNumber(data.totalElements)} tài khoản`}
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
