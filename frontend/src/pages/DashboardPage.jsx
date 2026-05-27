import { useOutletContext } from 'react-router-dom'

function DashboardPage() {
  const { profile } = useOutletContext()

  return (
    <main className="page-shell">
      <section className="card">
        <div className="topbar">
          <div>
            <p className="brand-kicker" style={{ marginBottom: 4 }}>Dashboard</p>
            <h1 className="page-title" style={{ fontSize: 30 }}>Tổng quan hệ thống OCR</h1>
          </div>
          <span className="badge">GD2 - Auth Ready</span>
        </div>

        <p className="page-subtitle">Trang này sẽ được mở rộng thẻ thống kê, biểu đồ và KPI ở GD7.</p>

        {profile ? (
          <pre className="codebox">{JSON.stringify(profile, null, 2)}</pre>
        ) : (
          <p className="muted" style={{ marginTop: 12 }}>Đang tải thông tin người dùng...</p>
        )}
      </section>
    </main>
  )
}

export default DashboardPage
