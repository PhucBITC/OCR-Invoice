import { useEffect, useState } from 'react'
import { authApi } from '../api/authApi'

function DashboardPage() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    authApi.me().then((res) => setProfile(res.data)).catch(() => setProfile(null))
  }, [])

  return (
    <main className="page-shell">
      <section className="card">
        <div className="topbar">
          <div>
            <p className="brand-kicker" style={{ marginBottom: 4 }}>Dashboard</p>
            <h1 className="page-title" style={{ fontSize: 30 }}>Tong quan he thong OCR</h1>
          </div>
          <span className="badge">GD2 - Auth Ready</span>
        </div>

        <p className="page-subtitle">Trang nay se duoc mo rong cards thong ke, chart va KPI o GD7.</p>

        {profile ? (
          <pre className="codebox">{JSON.stringify(profile, null, 2)}</pre>
        ) : (
          <p className="muted" style={{ marginTop: 12 }}>Dang tai thong tin nguoi dung...</p>
        )}
      </section>
    </main>
  )
}

export default DashboardPage
