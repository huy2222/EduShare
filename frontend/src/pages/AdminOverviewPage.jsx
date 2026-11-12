import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminIcon, formatAdminNumber } from "../components/AdminUi";
import { getOverview } from "../services/adminApi";
import { adminSections } from "./adminSections";

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
            <strong>{formatAdminNumber(data[key])}</strong>
            <small>Dữ liệu trong hệ thống</small>
          </div>
          <span className={`admin-stat-icon ${key}`}>
            <AdminIcon name={key} />
          </span>
        </article>
      ))}
    </div>
  );
}

export default function AdminOverviewPage() {
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
              <b>{formatAdminNumber(data.activeUsers)}</b>
            </p>
            <p>
              <span>Đã khoá / ngừng hoạt động</span>
              <b>{formatAdminNumber(data.lockedUsers)}</b>
            </p>
            <p>
              <span>Chờ xác thực</span>
              <b>{formatAdminNumber(data.users - data.activeUsers - data.lockedUsers)}</b>
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
                <AdminIcon name={key} />
              </span>
              <div>
                <b>{adminSections[key]}</b>
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
