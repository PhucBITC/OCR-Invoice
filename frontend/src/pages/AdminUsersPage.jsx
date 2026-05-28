import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { adminUserApi } from '../api/adminUserApi'

function AdminUsersPage() {
  const { profile } = useOutletContext()
  const isAdmin = profile?.role === 'ADMIN'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h2>Không có quyền truy cập</h2>
        <p className="muted" style={{ marginTop: 8 }}>Trang này chỉ dành cho quản trị viên hệ thống.</p>
      </div>
    )
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await adminUserApi.getAll()
      setUsers(res.data)
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách người dùng.')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId)
    try {
      await adminUserApi.updateRole(userId, newRole)
      fetchUsers()
    } catch (err) {
      alert(err.message || 'Không thể cập nhật quyền.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleStatusToggle = async (userId, currentStatus) => {
    setUpdatingId(userId)
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await adminUserApi.updateStatus(userId, newStatus)
      fetchUsers()
    } catch (err) {
      alert(err.message || 'Không thể cập nhật trạng thái.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Quản lý Người dùng</h1>
        </div>
      </div>

      {error ? <p className="auth-error" style={{ marginBottom: 16 }}>{error}</p> : null}

      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>
            Đang tải danh sách người dùng...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>
            Không tìm thấy người dùng nào phù hợp.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Phân quyền</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.fullName}</td>
                  <td><code>{user.email}</code></td>
                  <td>
                    <select
                      value={user.role}
                      disabled={updatingId === user.id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      style={{ padding: '6px 12px', fontSize: 13, width: 140 }}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="STAFF">STAFF</option>
                      <option value="REVIEWER">REVIEWER</option>
                      <option value="MANAGER">MANAGER</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                      {user.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={`btn btn-sm ${user.status === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={updatingId === user.id}
                      onClick={() => handleStatusToggle(user.id, user.status)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {user.status === 'ACTIVE' ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          <span>Khóa tài khoản</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                          </svg>
                          <span>Mở khóa</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminUsersPage
