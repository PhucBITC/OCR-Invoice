import { useState, useEffect, useRef } from 'react'
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/authApi'

function ProtectedLayout() {
  const token = localStorage.getItem('accessToken')
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

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

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
        <div className="sidebar-logo" style={{ marginBottom: 32, paddingLeft: 8 }}>
          <div className="logo-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--blue) 0%, #1e40af 100%)',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(29, 78, 216, 0.25)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--ink)', letterSpacing: '-0.5px' }}>Invoice OCR</span>
              <span style={{ fontSize: '10px', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>AI Platform</span>
            </div>
          </div>
        </div>
        
        <nav className="sidebar-menu">
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            {/* Dashboard SVG Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink to="/upload" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            {/* Upload SVG Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <span>Tải chứng từ</span>
          </NavLink>

          <NavLink to="/documents" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            {/* Documents List SVG Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Danh sách tài liệu</span>
          </NavLink>

          <NavLink to="/verified-invoices" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            {/* Verified Invoices Check-Decal SVG Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Hóa đơn đã duyệt</span>
          </NavLink>

          {isAdmin && (
            <>
              <NavLink to="/audit-logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                {/* Audit Logs SVG Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                <span>Nhật ký hệ thống</span>
              </NavLink>

              <NavLink to="/companies" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                {/* Company SVG Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span>Công ty</span>
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                {/* Users SVG Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>Người dùng</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          {/* Header Search bar */}
          <div className="header-search">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Tìm kiếm tài liệu, công ty..." />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Notification Bell */}
            <button className="header-action-btn" aria-label="Notifications">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span className="bell-badge"></span>
            </button>

            {/* Profile Dropdown Container */}
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <button className="profile-dropdown-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="user-avatar">{getInitials(profile?.fullName)}</div>
                <div className="user-meta" style={{ textAlign: 'left' }}>
                  <span className="name">{profile?.fullName}</span>
                  <span className="role-badge">{profile?.role}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4, color: 'var(--ink-soft)' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <p className="dropdown-email">{profile?.email}</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { setDropdownOpen(false); alert('Chức năng sửa thông tin sẽ được cập nhật.'); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Sửa thông tin</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { setDropdownOpen(false); alert('Cài đặt hệ thống.'); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span>Cài đặt</span>
                  </button>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <Outlet context={{ profile }} />
      </main>
    </div>
  )
}

export default ProtectedLayout
