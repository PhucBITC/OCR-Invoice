import { useOutletContext } from 'react-router-dom'

function DashboardPage() {
  const { profile } = useOutletContext()

  return (
    <div className="page-container">
      {/* Welcome Section */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title" style={{ fontSize: 28, fontWeight: 700 }}>
          Chào mừng quay trở lại, {profile?.fullName || 'Người dùng'}
        </h1>
        <p className="page-subtitle" style={{ marginTop: 4 }}>
          Dưới đây là tóm tắt số liệu hoạt động quét hóa đơn và quản trị hệ thống của bạn.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="dashboard-stats-grid">
        {/* Total Invoices */}
        <div className="stat-card">
          <div className="stat-card-info">
            <span className="stat-card-title">Tổng hóa đơn quét</span>
            <span className="stat-card-value">1,248</span>
            <span className="stat-card-trend up">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              <span>+12.4% tháng này</span>
            </span>
          </div>
          <div className="stat-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="stat-card">
          <div className="stat-card-info">
            <span className="stat-card-title">Chờ phê duyệt</span>
            <span className="stat-card-value">14</span>
            <span className="stat-card-trend" style={{ color: '#d97706' }}>
              <span>Cần xử lý sớm</span>
            </span>
          </div>
          <div className="stat-card-icon pending">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>

        {/* OCR Accuracy */}
        <div className="stat-card">
          <div className="stat-card-info">
            <span className="stat-card-title">Độ chính xác AI</span>
            <span className="stat-card-value">98.4%</span>
            <span className="stat-card-trend up">
              <span>Động cơ AI v2.1</span>
            </span>
          </div>
          <div className="stat-card-icon accuracy">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
          </div>
        </div>

        {/* Total Companies */}
        <div className="stat-card">
          <div className="stat-card-info">
            <span className="stat-card-title">Doanh nghiệp liên kết</span>
            <span className="stat-card-value">6</span>
            <span className="stat-card-trend" style={{ color: '#7c3aed' }}>
              <span>Đang hoạt động</span>
            </span>
          </div>
          <div className="stat-card-icon companies">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
              <line x1="9" y1="22" x2="9" y2="16"></line>
              <line x1="15" y1="22" x2="15" y2="16"></line>
              <line x1="9" y1="16" x2="15" y2="16"></line>
            </svg>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="dashboard-sections">
        {/* Recent Invoices */}
        <div className="recent-docs-card">
          <div className="card-header">
            <h2 className="card-title">Hóa đơn xử lý gần đây</h2>
            <button className="btn btn-secondary btn-sm" style={{ border: 0, padding: '4px 8px' }}>
              Xem tất cả
            </button>
          </div>

          <table className="data-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Số hóa đơn</th>
                <th>Nhà cung cấp</th>
                <th>Ngày quét</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>HD-00924</td>
                <td>Công ty TNHH Phát triển Công nghệ Việt</td>
                <td>27/05/2026</td>
                <td style={{ fontWeight: 600 }}>15,450,000 đ</td>
                <td>
                  <span className="status-badge status-active">Đã xử lý</span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>HD-00923</td>
                <td>Cửa hàng Tiện lợi MilkStore</td>
                <td>27/05/2026</td>
                <td style={{ fontWeight: 600 }}>1,200,000 đ</td>
                <td>
                  <span className="status-badge status-active">Đã xử lý</span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>HD-00922</td>
                <td>Tổng Công ty Dịch vụ Viễn thông</td>
                <td>26/05/2026</td>
                <td style={{ fontWeight: 600 }}>4,800,000 đ</td>
                <td>
                  <span className="status-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                    Chờ duyệt
                  </span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>HD-00921</td>
                <td>Siêu thị Điện máy Xanh</td>
                <td>25/05/2026</td>
                <td style={{ fontWeight: 600 }}>28,900,000 đ</td>
                <td>
                  <span className="status-badge status-inactive">Lỗi quét</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* System Activity */}
        <div className="system-status-card">
          <div className="card-header">
            <h2 className="card-title">Hoạt động hệ thống</h2>
          </div>

          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="activity-text">
                <div>Bạn đã cập nhật vai trò của <strong>nguyenvana@gmail.com</strong> thành <strong>STAFF</strong></div>
                <span className="activity-time">5 phút trước</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                  <line x1="9" y1="22" x2="9" y2="16"></line>
                  <line x1="15" y1="22" x2="15" y2="16"></line>
                </svg>
              </div>
              <div className="activity-text">
                <div>Công ty <strong>MilkStore</strong> vừa được đăng ký vào hệ thống</div>
                <span className="activity-time">1 giờ trước</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <div className="activity-text">
                <div>OCR hoàn thành trích xuất dữ liệu hóa đơn <strong>HD-00924</strong></div>
                <span className="activity-time">2 giờ trước</span>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div className="activity-text">
                <div>Đã đồng bộ thành công Cấu hình Seed dữ liệu Phase 3</div>
                <span className="activity-time">Hôm qua</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
