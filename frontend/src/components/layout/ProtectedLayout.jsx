import { useState, useEffect, useRef } from 'react'
import { Navigate, Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { documentApi } from '../../api/documentApi'

function ProtectedLayout() {
  const token = localStorage.getItem('accessToken')
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const location = useLocation()

  // Notification states
  const [notifications, setNotifications] = useState([])
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef(null)

  // Change password states
  const [changePwdModalOpen, setChangePwdModalOpen] = useState(false)
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' })
  const [pwdError, setPwdError] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [showOldPwd, setShowOldPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmNewPwd, setShowConfirmNewPwd] = useState(false)

  // Edit profile states
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false)
  const [profileForm, setProfileForm] = useState({ fullName: '' })
  const [profileError, setProfileError] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!loading && profile) {
      const isAdmin = profile.role === 'ADMIN'
      const canSeeDashboard = isAdmin || profile.role === 'MANAGER'

      // Guard for Dashboard
      if (location.pathname === '/dashboard' && !canSeeDashboard) {
        navigate('/documents', { replace: true })
        toast.error('Bạn không có quyền truy cập Dashboard.')
        return
      }

      // Guard for Admin-only pages
      const adminOnlyPaths = ['/admin/users', '/companies', '/audit-logs']
      const isTryingAdminPath = adminOnlyPaths.some(p => location.pathname.startsWith(p))
      if (isTryingAdminPath && !isAdmin) {
        navigate('/documents', { replace: true })
        toast.error('Bạn không có quyền truy cập vào chức năng này.')
      }
    }
  }, [loading, profile, location.pathname, navigate])

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

  // Load notifications from system audit logs
  const fetchNotifications = async () => {
    try {
      const res = await documentApi.getSystemAuditLogs({ page: 0, size: 20 })
      if (res.data && res.data.content) {
        const logs = res.data.content
        
        // Retrieve read IDs from localStorage
        const readIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]')
        
        // Filter only relevant actions: OCR_EDIT, VERIFIED, REJECTED
        const relevantLogs = logs.filter(log => ['OCR_EDIT', 'VERIFIED', 'REJECTED'].includes(log.action))
        
        // Determine which ones are unread
        let unreadLogs = relevantLogs.filter(log => !readIds.includes(log.id))
        
        // Auto-read if user is currently viewing the document
        const match = window.location.pathname.match(/^\/documents\/(\d+)\/review/)
        if (match) {
          const docId = parseInt(match[1], 10)
          const viewingLogs = unreadLogs.filter(n => n.documentId === docId)
          if (viewingLogs.length > 0) {
            const newReadIds = [...readIds, ...viewingLogs.map(n => n.id)]
            localStorage.setItem('readNotificationIds', JSON.stringify(newReadIds))
            unreadLogs = unreadLogs.filter(n => n.documentId !== docId)
          }
        }
        
        setNotifications(unreadLogs)
        setUnreadCount(unreadLogs.length)
      }
    } catch (err) {
      console.warn('Failed to load notifications', err)
    }
  }

  useEffect(() => {
    if (token) {
      fetchNotifications()
      
      // Poll every 10 seconds to look for edits/approvals
      const interval = setInterval(fetchNotifications, 10000)
      return () => clearInterval(interval)
    }
  }, [token])

  // Auto-read notifications if the user visits the review page for that document
  useEffect(() => {
    const match = location.pathname.match(/^\/documents\/(\d+)\/review/)
    if (match && notifications.length > 0) {
      const docId = parseInt(match[1], 10)
      const viewingLogs = notifications.filter(n => n.documentId === docId)
      if (viewingLogs.length > 0) {
        const readIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]')
        const newReadIds = [...readIds, ...viewingLogs.map(n => n.id)]
        localStorage.setItem('readNotificationIds', JSON.stringify(newReadIds))
        
        // Remove from UI notifications and update count
        setNotifications(prev => prev.filter(n => n.documentId !== docId))
        setUnreadCount(prev => Math.max(0, prev - viewingLogs.length))
      }
    }
  }, [location.pathname, notifications])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwdError('')
    
    if (!pwdForm.oldPassword) {
      setPwdError('Vui lòng nhập mật khẩu cũ.')
      return
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (pwdForm.newPassword !== pwdForm.confirmNewPassword) {
      setPwdError('Mật khẩu mới và xác nhận mật khẩu mới không khớp.')
      return
    }

    setPwdLoading(true)
    try {
      await authApi.changePassword({
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword
      })
      toast.success('Đổi mật khẩu thành công!')
      setChangePwdModalOpen(false)
      setPwdForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' })
      setShowOldPwd(false)
      setShowNewPwd(false)
      setShowConfirmNewPwd(false)
    } catch (err) {
      setPwdError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi đổi mật khẩu.')
    } finally {
      setPwdLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileError('')
    
    if (!profileForm.fullName.trim()) {
      setProfileError('Vui lòng nhập họ và tên.')
      return
    }

    setProfileLoading(true)
    try {
      const res = await authApi.updateProfile({
        fullName: profileForm.fullName.trim()
      })
      if (res && res.data) {
        setProfile(res.data)
      } else {
        setProfile(prev => ({ ...prev, fullName: profileForm.fullName.trim() }))
      }
      toast.success('Cập nhật thông tin thành công!')
      setEditProfileModalOpen(false)
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi cập nhật thông tin.')
    } finally {
      setProfileLoading(false)
    }
  }

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false)
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
  const isStaff = profile?.role === 'STAFF'
  const canSeeDashboard = profile?.role === 'ADMIN' || profile?.role === 'MANAGER'
  const canUpload = profile?.role === 'ADMIN' || profile?.role === 'STAFF'

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
          {canSeeDashboard && (
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
          )}
          
          {canUpload && (
            <NavLink to="/upload" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              {/* Upload SVG Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Tải chứng từ</span>
            </NavLink>
          )}

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
            <div className="notification-container" ref={notifRef}>
              <button 
                className="header-action-btn" 
                aria-label="Notifications"
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen)
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
              </button>

              {notifDropdownOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Thông báo hoạt động</span>
                    {unreadCount > 0 && (
                      <button 
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--blue)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--gray-hover, #f3f4f6)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        onClick={(e) => {
                          e.stopPropagation();
                          const readIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]')
                          const newReadIds = [...readIds, ...notifications.map(n => n.id)]
                          localStorage.setItem('readNotificationIds', JSON.stringify(newReadIds))
                          setNotifications([])
                          setUnreadCount(0)
                        }}
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.map((log) => {
                      let title = ''
                      let color = 'var(--blue)'
                      if (log.action === 'OCR_EDIT') {
                        title = `${log.performedByName} đã cập nhật nháp`
                        color = 'var(--blue)'
                      } else if (log.action === 'VERIFIED') {
                        title = `${log.performedByName} đã phê duyệt`
                        color = '#10b981'
                      } else if (log.action === 'REJECTED') {
                        title = `${log.performedByName} đã từ chối`
                        color = 'var(--danger)'
                      } else {
                        title = `${log.performedByName} thực hiện: ${log.action}`
                      }

                      return (
                        <div 
                          key={log.id} 
                          className="notification-item"
                          onClick={() => {
                            setNotifDropdownOpen(false)
                            const readIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]')
                            if (!readIds.includes(log.id)) {
                              const newReadIds = [...readIds, log.id]
                              localStorage.setItem('readNotificationIds', JSON.stringify(newReadIds))
                              setNotifications(prev => prev.filter(n => n.id !== log.id))
                              setUnreadCount(prev => Math.max(0, prev - 1))
                            }
                            navigate(`/documents/${log.documentId}/review`)
                          }}
                        >
                          <div className="notification-item-header">
                            <span style={{ color, fontWeight: 700, fontSize: '10px' }}>
                              {log.action === 'OCR_EDIT' ? 'CẬP NHẬT NHÁP' : log.action === 'VERIFIED' ? 'ĐÃ PHÊ DUYỆT' : 'BỊ TỪ CHỐI'}
                            </span>
                            <span className="notification-item-time">
                              {new Date(log.performedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="notification-item-title">{title}</div>
                          <div className="notification-item-desc">{log.details}</div>
                        </div>
                      )
                    })}
                    {notifications.length === 0 && (
                      <div className="notification-empty">Không có thông báo mới nào.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
                  <button className="dropdown-item" onClick={() => { 
                    setDropdownOpen(false); 
                    setProfileForm({ fullName: profile?.fullName || '' });
                    setProfileError('');
                    setEditProfileModalOpen(true); 
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Sửa thông tin</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { setDropdownOpen(false); setChangePwdModalOpen(true); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>Đổi mật khẩu</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { setDropdownOpen(false); toast('Cài đặt hệ thống.', { icon: '⚙️' }); }}>
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

        {/* Change Password Modal */}
        {changePwdModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '440px',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              border: '1px solid var(--gray-border, #e5e7eb)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>Đổi mật khẩu</h3>
                <button 
                  onClick={() => {
                    setChangePwdModalOpen(false)
                    setPwdForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' })
                    setPwdError('')
                    setShowOldPwd(false)
                    setShowNewPwd(false)
                    setShowConfirmNewPwd(false)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-soft)',
                    cursor: 'pointer',
                    fontSize: '20px',
                    padding: '4px'
                  }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-soft)' }}>Mật khẩu hiện tại</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showOldPwd ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu hiện tại"
                      value={pwdForm.oldPassword}
                      onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--gray-border, #d1d5db)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPwd(!showOldPwd)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--ink-soft, #6b7280)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showOldPwd ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-soft)' }}>Mật khẩu mới</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                      value={pwdForm.newPassword}
                      onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--gray-border, #d1d5db)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--ink-soft, #6b7280)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showNewPwd ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-soft)' }}>Xác nhận mật khẩu mới</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmNewPwd ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu mới"
                      value={pwdForm.confirmNewPassword}
                      onChange={(e) => setPwdForm({ ...pwdForm, confirmNewPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--gray-border, #d1d5db)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPwd(!showConfirmNewPwd)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--ink-soft, #6b7280)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showConfirmNewPwd ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      )}
                    </button>
                  </div>
                </div>

                {pwdError && (
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--danger, #ef4444)', fontWeight: 500 }}>
                    {pwdError}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setChangePwdModalOpen(false)
                      setPwdForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' })
                      setPwdError('')
                      setShowOldPwd(false)
                      setShowNewPwd(false)
                      setShowConfirmNewPwd(false)
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-border, #d1d5db)',
                      background: 'white',
                      color: 'var(--ink)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'var(--blue, #2563eb)',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: pwdLoading ? 0.7 : 1
                    }}
                  >
                    {pwdLoading ? 'Đang đổi...' : 'Xác nhận'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {editProfileModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '440px',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              border: '1px solid var(--gray-border, #e5e7eb)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>Chỉnh sửa thông tin</h3>
                <button 
                  onClick={() => {
                    setEditProfileModalOpen(false)
                    setProfileError('')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-soft)',
                    cursor: 'pointer',
                    fontSize: '20px',
                    padding: '4px'
                  }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Email (Read-only) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-soft)' }}>Email (Không thể thay đổi)</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-border, #d1d5db)',
                      backgroundColor: '#f3f4f6',
                      color: 'var(--ink-soft)',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>

                {/* Role (Read-only) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-soft)' }}>Vai trò</label>
                  <div style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--gray-border, #d1d5db)',
                    backgroundColor: '#f3f4f6',
                    color: 'var(--ink-soft)',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span className="role-badge" style={{ margin: 0 }}>{profile?.role}</span>
                  </div>
                </div>

                {/* Full Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Họ và tên</label>
                  <input
                    type="text"
                    placeholder="Nhập họ và tên của bạn"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-border, #d1d5db)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    required
                  />
                </div>

                {profileError && (
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--danger, #ef4444)', fontWeight: 500 }}>
                    {profileError}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditProfileModalOpen(false)
                      setProfileError('')
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-border, #d1d5db)',
                      background: 'white',
                      color: 'var(--ink)',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'var(--blue, #2563eb)',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      opacity: profileLoading ? 0.7 : 1
                    }}
                  >
                    {profileLoading ? 'Đang lưu...' : 'Xác nhận'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={4000} theme="light" />
        <Outlet context={{ profile }} />
      </main>
    </div>
  )
}

export default ProtectedLayout
