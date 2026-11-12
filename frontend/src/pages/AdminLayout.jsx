import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, useParams } from "react-router-dom";
import brandMark from "../assets/brand-mark.svg";
import AdminAccess from "../components/AdminAccess";
import Catalog from "../components/AdminCatalog";
import { AdminIcon } from "../components/AdminUi";
import { hasPermission, sectionPermissions } from "../services/adminAccess";
import { getCurrentUser } from "../services/authApi";
import AdminAcademicPage from "./AdminAcademicPage";
import AdminDocumentsPage from "./AdminDocumentsPage";
import AdminOverviewPage from "./AdminOverviewPage";
import AdminUsersPage from "./AdminUsersPage";
import { adminSections } from "./adminSections";
import "../styles/admin.css";

export default function AdminLayout({
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
  const allowed = (key) =>
    hasPermission(user, ...(sectionPermissions[key] || []));
  const visible = Object.entries(adminSections).filter(([key]) => allowed(key));
  if (error || !visible.length)
    return (
      <main className="admin-access">
        <h1>{error || "Bạn không có quyền quản trị"}</h1>
        <Link to="/">Về trang chủ</Link>
      </main>
    );
  if (!adminSections[section] || !allowed(section))
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
              <AdminIcon name={key} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link to="/">
            <AdminIcon name="arrow" />
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
            <p>QUẢN TRỊ / {adminSections[section].toLocaleUpperCase("vi")}</p>
            <h1>{adminSections[section]}</h1>
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
            <AdminOverviewPage />
          ) : section === "documents" ? (
            <AdminDocumentsPage key="management" mode="management" />
          ) : section === "moderation" ? (
            <AdminDocumentsPage key="moderation" mode="moderation" />
          ) : section === "users" ? (
            <AdminUsersPage currentUser={user} />
          ) : section === "access" ? (
            <AdminAccess
              currentUser={user}
              renderUsers={() => <AdminUsersPage currentUser={user} />}
            />
          ) : section === "faculties" ? (
            <AdminAcademicPage currentUser={user} />
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
