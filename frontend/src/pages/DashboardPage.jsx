import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { dashboardApi } from '../api/dashboardApi'

function DashboardPage() {
  const { profile } = useOutletContext()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [charts, setCharts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Tooltip state for SVG charts
  const [hoveredBar, setHoveredBar] = useState(null) // { label, value, x, y }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    try {
      const [statsRes, chartsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getCharts()
      ])
      
      if (statsRes.data) {
        setStats(statsRes.data)
      }
      if (chartsRes.data) {
        setCharts(chartsRes.data)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tải dữ liệu phân tích hệ thống.')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN')
  }

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diffMs = new Date() - new Date(dateStr)
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`
    return formatDate(dateStr)
  }

  const getStatusLabel = (s) => {
    switch (s) {
      case 'UPLOADED': return 'Đã tải lên'
      case 'OCR_PROCESSING': return 'Đang xử lý AI'
      case 'NEED_REVIEW': return 'Cần rà soát'
      case 'VERIFIED': return 'Đã duyệt'
      case 'REJECTED': return 'Từ chối'
      case 'ERROR': return 'Lỗi hệ thống'
      default: return s
    }
  }

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case 'VERIFIED': return 'status-badge status-active'
      case 'REJECTED': return 'status-badge status-inactive'
      case 'NEED_REVIEW': return 'status-badge status-warning'
      case 'OCR_PROCESSING': return 'status-badge status-processing'
      default: return 'status-badge'
    }
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--ink-soft)' }}>Đang tải báo cáo phân tích và thống kê...</p>
      </div>
    )
  }

  // Pre-process bar chart data
  const revenueData = charts?.revenueData || []
  const maxRevenue = Math.max(...revenueData.map(d => d.value), 1000000)

  // Pre-process status pie / horizontal bars
  const statusData = charts?.statusData || []
  const totalDocs = statusData.reduce((sum, item) => sum + item.count, 0) || 1

  return (
    <div className="page-container">
      {/* Welcome Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 28, fontWeight: 700 }}>
            Chào mừng quay lại, {profile?.fullName || 'Kế toán viên'}
          </h1>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Theo dõi tổng quan tài liệu OCR và hoạt động đối soát hóa đơn thời gian thực.
          </p>
        </div>
        <button className="btn btn-primary" onClick={fetchDashboardData} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Làm mới
        </button>
      </div>

      {error && <p className="auth-error" style={{ marginBottom: 16 }}>{error}</p>}

      {/* KPI stats Grid */}
      <div className="dashboard-stats-grid" style={{ marginBottom: 28 }}>
        {/* KPI: Total Docs */}
        <div className="stat-card">
          <div className="stat-card-info">
            <span className="stat-card-title">Tổng số chứng từ</span>
            <span className="stat-card-value">{stats?.totalDocuments || 0}</span>
            <span className="stat-card-trend" style={{ color: 'var(--ink-soft)' }}>
              Từ trước đến nay
            </span>
          </div>
          <div className="stat-card-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: 'var(--blue)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
        </div>

        {/* KPI: Pending Docs */}
        <div className="stat-card">
          <div className="stat-card-info">
            <span className="stat-card-title">Chờ duyệt / Xử lý</span>
            <span className="stat-card-value">{stats?.pendingDocuments || 0}</span>
            <span className="stat-card-trend" style={{ color: '#d97706' }}>
              Yêu cầu rà soát
            </span>
          </div>
          <div className="stat-card-icon pending" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#d97706' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>

        {/* KPI: Accuracy */}
        <div className="stat-card">
          <div className="stat-card-info">
            <span className="stat-card-title">Độ chính xác trung bình</span>
            <span className="stat-card-value">
              {stats?.averageAccuracy ? (stats.averageAccuracy * 100).toFixed(1) + '%' : '95.0%'}
            </span>
            <span className="stat-card-trend up" style={{ color: 'var(--emerald)' }}>
              Động cơ OCR AI
            </span>
          </div>
          <div className="stat-card-icon accuracy" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--emerald)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
          </div>
        </div>

        {/* KPI: Companies */}
        <div className="stat-card">
          <div className="stat-card-info">
            <span className="stat-card-title">Doanh nghiệp</span>
            <span className="stat-card-value">{stats?.totalCompanies || 0}</span>
            <span className="stat-card-trend" style={{ color: '#7c3aed' }}>
              Đối tác liên kết
            </span>
          </div>
          <div className="stat-card-icon companies" style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7c3aed' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Chart Layout Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Monthly Revenue (Bar Chart SVG) */}
        <div className="table-card" style={{ padding: '24px 28px', position: 'relative' }}>
          <h2 className="card-title" style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            Doanh thu đối soát theo tháng ({new Date().getFullYear()})
          </h2>

          <div style={{ position: 'relative', width: '100%', height: '240px' }}>
            <svg width="100%" height="100%" viewBox="0 0 540 240" preserveAspectRatio="none">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85"/>
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.3"/>
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = 30 + ratio * 160
                return (
                  <g key={i}>
                    <line x1="45" y1={y} x2="520" y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="35" y={y + 4} fill="var(--ink-soft)" fontSize="10" textAnchor="end">
                      {ratio === 1 ? '0' : ((1 - ratio) * maxRevenue / 1000000).toFixed(0) + 'M'}
                    </text>
                  </g>
                )
              })}

              {/* Columns */}
              {revenueData.map((item, idx) => {
                const colWidth = 24
                const gap = 14
                const x = 55 + idx * (colWidth + gap)
                const height = (item.value / maxRevenue) * 160
                const y = 190 - height

                return (
                  <g key={idx}>
                    {/* Hover rect overlay */}
                    <rect
                      x={x - 4}
                      y="20"
                      width={colWidth + 8}
                      height="180"
                      fill="transparent"
                      cursor="pointer"
                      onMouseEnter={(e) => {
                        const bounds = e.target.getBoundingClientRect()
                        setHoveredBar({
                          label: `Tháng ${item.label}`,
                          value: formatCurrency(item.value),
                          x: x + 12,
                          y: y - 10
                        })
                      }}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    
                    {/* Actual Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={colWidth}
                      height={Math.max(height, 2)}
                      rx="4"
                      fill="url(#barGrad)"
                      style={{ transition: 'all 0.3s ease' }}
                    />
                    
                    {/* X axis Label */}
                    <text x={x + 12} y="210" fill="var(--ink-soft)" fontSize="11" fontWeight="600" textAnchor="middle">
                      {item.label}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredBar && (
              <div style={{
                position: 'absolute',
                left: `${(hoveredBar.x / 540) * 100}%`,
                top: `${(hoveredBar.y / 240) * 100}%`,
                transform: 'translate(-50%, -100%)',
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                whiteSpace: 'nowrap',
                zIndex: 10,
                fontWeight: 600
              }}>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: 2 }}>{hoveredBar.label}</div>
                <div>{hoveredBar.value}</div>
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution (Progress indicators / Circular SVG) */}
        <div className="table-card" style={{ padding: '24px 28px' }}>
          <h2 className="card-title" style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            Phân bố tài liệu theo trạng thái
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {statusData.map((item, idx) => {
              const pct = ((item.count / totalDocs) * 100).toFixed(1)
              let color = '#3b82f6'
              if (item.status === 'VERIFIED') color = '#10b981'
              if (item.status === 'REJECTED') color = '#ef4444'
              if (item.status === 'NEED_REVIEW') color = '#f59e0b'
              if (item.status === 'ERROR') color = '#9a3412'

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                      {getStatusLabel(item.status)}
                    </span>
                    <span style={{ color: 'var(--ink-soft)' }}>
                      <b>{item.count}</b> ({pct}%)
                    </span>
                  </div>
                  {/* Progress Line */}
                  <div style={{ width: '100%', height: 8, background: 'var(--border)', borderRadius: 999 }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: color,
                      borderRadius: 999,
                      transition: 'width 0.8s ease-out'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Sections (Recent Documents & Activities) */}
      <div className="dashboard-sections">
        {/* Recent Invoices list */}
        <div className="recent-docs-card">
          <div className="card-header">
            <h2 className="card-title">Hóa đơn xử lý gần đây</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/documents')} style={{ border: 0, padding: '4px 12px' }}>
              Xem tất cả
            </button>
          </div>

          <table className="data-table" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Tên file hóa đơn</th>
                <th>Số hóa đơn</th>
                <th>Doanh nghiệp</th>
                <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                <th style={{ width: '130px' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
                stats.recentDocuments.map((doc) => (
                  <tr key={doc.id} onClick={() => navigate(`/documents/${doc.id}/review`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600, color: 'var(--blue)' }}>
                      {doc.fileName}
                    </td>
                    <td><code>{doc.invoiceNumber || '-'}</code></td>
                    <td>{doc.companyName || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: doc.totalAmount ? 'var(--emerald)' : 'var(--ink-soft)' }}>
                      {doc.totalAmount ? formatCurrency(doc.totalAmount) : '-'}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(doc.status)}>
                        {getStatusLabel(doc.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 30, color: 'var(--ink-soft)' }}>
                    Chưa có hóa đơn nào được tải lên gần đây.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* System audit log feeds */}
        <div className="system-status-card">
          <div className="card-header">
            <h2 className="card-title">Hoạt động gần đây</h2>
          </div>

          <div className="activity-list" style={{ marginTop: 12 }}>
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act) => {
                let actColor = 'rgba(59, 130, 246, 0.08)'
                let textCol = 'var(--blue)'
                if (act.action === 'VERIFIED') { actColor = 'rgba(16, 185, 129, 0.08)'; textCol = 'var(--emerald)'; }
                if (act.action === 'REJECTED') { actColor = 'rgba(239, 68, 68, 0.08)'; textCol = 'var(--danger)'; }

                return (
                  <div key={act.id} className="activity-item" style={{ borderLeft: `3px solid ${textCol}`, paddingLeft: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                      <div className="activity-text" style={{ paddingLeft: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {act.performedByName} <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>({act.performedByEmail})</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 2 }}>{act.details}</div>
                      </div>
                      <span className="activity-time" style={{ fontSize: 11, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                        {formatTimeAgo(act.performedAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--ink-soft)' }}>
                Chưa có lịch sử hoạt động nào được ghi lại.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
