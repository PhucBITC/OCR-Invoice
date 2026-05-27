import { useState, useEffect } from 'react'
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/authApi'

function ProtectedLayout() {
  const token = localStorage.getItem('accessToken')
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const res = await authApi.me()
        setProfile(res.data)
      } catch (err) {
        console.error('Failed to fetch profile', err)
        localStorage.removeItem('accessToken')
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [token, navigate])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--ink-soft)' }}>Đang tải cấu hình hệ thống...</p>
      </div>
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2)
    return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase()
  }

  const isAdmin = profile?.role === 'ADMIN'

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">Invoice OCR</div>
        <nav className="sidebar-menu">
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span>📊 Dashboard</span>
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/companies" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span>🏢 Công ty</span>
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span>👥 Người dùng</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="user-profile-info">
            <div className="user-avatar">{getInitials(profile?.fullName)}</div>
            <div className="user-meta">
              <span className="name">{profile?.fullName}</span>
              <span className="role-badge">{profile?.role}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Đăng xuất</button>
        </header>

        <Outlet context={{ profile }} />
      </main>
    </div>
  )
}

export default ProtectedLayout
