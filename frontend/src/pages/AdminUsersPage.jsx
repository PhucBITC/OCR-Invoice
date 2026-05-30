import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { adminUserApi } from '../api/adminUserApi'
import { toast } from 'react-toastify'
import ConfirmModal from '../components/common/ConfirmModal'

const ROLES = ['ADMIN', 'STAFF', 'REVIEWER', 'MANAGER']

const defaultCreateForm = {
  email: '',
  fullName: '',
  role: 'STAFF',
  password: '',
  status: 'ACTIVE',
}

function AdminUsersPage() {
  const { profile } = useOutletContext()
  const isAdmin = profile?.role === 'ADMIN'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [createForm, setCreateForm] = useState(defaultCreateForm)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUserId, setEditUserId] = useState(null)
  const [editForm, setEditForm] = useState({ fullName: '', role: 'STAFF', status: 'ACTIVE', password: '' })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)

  useEffect(() => {
    if (!createOpen) setShowCreatePassword(false)
  }, [createOpen])

  useEffect(() => {
    setShowEditPassword(false)
  }, [editUserId])

  useEffect(() => {
    if (isAdmin) fetchUsers()
  }, [isAdmin])

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminUserApi.getAll()
      setUsers(res.data)
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách người dùng.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      await adminUserApi.create(createForm)
      toast.success('Tạo người dùng thành công!')
      setCreateForm(defaultCreateForm)
      setCreateOpen(false)
      fetchUsers()
    } catch (err) {
      toast.error(err.message || 'Không thể tạo người dùng.')
    }
  }

  const startEdit = (user) => {
    setEditUserId(user.id)
    setEditForm({
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      password: '',
    })
  }

  const cancelEdit = () => {
    setEditUserId(null)
    setEditForm({ fullName: '', role: 'STAFF', status: 'ACTIVE', password: '' })
  }

  const saveEdit = async (userId) => {
    setUpdatingId(userId)
    try {
      const originalUser = users.find((user) => user.id === userId)
      const payload = {
        fullName: editForm.fullName,
        role: editForm.role,
        status: editForm.status,
      }
      if (editForm.password.trim()) payload.password = editForm.password.trim()
      try {
        await adminUserApi.update(userId, payload)
        toast.success('Cập nhật người dùng thành công!')
      } catch (err) {
        if (err.status !== 404 && err.status !== 405) throw err
        if (editForm.password.trim() || editForm.fullName !== originalUser?.fullName) {
          throw new Error('Backend đang chạy bản cũ. Hãy restart backend để lưu họ tên hoặc mật khẩu mới.')
        }
        if (editForm.role !== originalUser?.role) {
          await adminUserApi.updateRole(userId, editForm.role)
        }
        if (editForm.status !== originalUser?.status) {
          await adminUserApi.updateStatus(userId, editForm.status)
        }
        toast.success('Cập nhật người dùng thành công!')
      }
      cancelEdit()
      fetchUsers()
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật người dùng.')
    } finally {
      setUpdatingId(null)
    }
  }

  const requestDelete = (user) => {
    setUserToDelete(user)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return
    setDeleteConfirmOpen(false)
    setUpdatingId(userToDelete.id)
    try {
      await adminUserApi.remove(userToDelete.id)
      toast.success('Xóa người dùng thành công!')
      fetchUsers()
    } catch (err) {
      toast.error(err.message || 'Không thể xóa người dùng.')
    } finally {
      setUpdatingId(null)
      setUserToDelete(null)
    }
  }

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length
  const inactiveCount = users.filter((u) => u.status === 'INACTIVE').length
  const deletedCount = users.filter((u) => u.status === 'DELETED').length

  if (!isAdmin) return <div className="page-container"><h2>Không có quyền truy cập</h2></div>

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <h1 className="page-title">Quản lý Người dùng</h1>
          <p className="muted" style={{ margin: '8px 0 0' }}>Quản trị tài khoản, phân quyền và trạng thái truy cập.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>Tạo người dùng</button>
      </div>

      <div className="dashboard-stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card"><div className="stat-card-info"><span className="stat-card-title">Tổng user</span><span className="stat-card-value">{users.length}</span></div></div>
        <div className="stat-card"><div className="stat-card-info"><span className="stat-card-title">Active</span><span className="stat-card-value" style={{ color: '#047857' }}>{activeCount}</span></div></div>
        <div className="stat-card"><div className="stat-card-info"><span className="stat-card-title">Inactive</span><span className="stat-card-value" style={{ color: '#b45309' }}>{inactiveCount}</span></div></div>
        <div className="stat-card"><div className="stat-card-info"><span className="stat-card-title">Deleted</span><span className="stat-card-value" style={{ color: '#b91c1c' }}>{deletedCount}</span></div></div>
      </div>

      {createOpen ? (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Tạo người dùng mới</h3>
              <button className="modal-close" onClick={() => setCreateOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="filter-input" placeholder="user@example.com" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input className="filter-input" placeholder="Nguyễn Văn A" value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} required />
                </div>
                <div className="filter-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Role</label>
                    <select className="filter-select" value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="filter-select" value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Mật khẩu</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="filter-input"
                      placeholder="Tối thiểu 6 ký tự"
                      type={showCreatePassword ? "text" : "password"}
                      minLength={6}
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--ink-soft, #8f8f8d)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none'
                      }}
                    >
                      {showCreatePassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Hủy</button>
                <button className="btn btn-primary" type="submit">Tạo mới</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {error ? <p className="auth-error">{error}</p> : null}

      <div className="table-card">
        <div className="table-toolbar">
          <input className="search-input" placeholder="Tìm tên hoặc email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 320 }} />
        </div>
        {loading ? <div style={{ padding: 24 }}>Đang tải...</div> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Password mới</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isEditing = editUserId === u.id
                const isSelf = u.id === profile?.id
                return (
                  <tr key={u.id}>
                    <td>{isEditing ? <input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} /> : u.fullName}</td>
                    <td><code>{u.email}</code></td>
                    <td>{isEditing ? <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}><option value="ADMIN">ADMIN</option><option value="STAFF">STAFF</option><option value="REVIEWER">REVIEWER</option><option value="MANAGER">MANAGER</option></select> : u.role}</td>
                    <td>{isEditing ? <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="DELETED">DELETED</option></select> : <span className={`status-badge ${u.status === 'ACTIVE' ? 'status-active' : u.status === 'INACTIVE' ? 'status-inactive' : ''}`}>{u.status}</span>}</td>
                    <td>
                      {isEditing ? (
                        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                          <input
                            type={showEditPassword ? "text" : "password"}
                            placeholder="Bỏ trống nếu không đổi"
                            value={editForm.password}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                            style={{ paddingRight: '32px', width: '100%' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--ink-soft, #8f8f8d)',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              outline: 'none'
                            }}
                          >
                            {showEditPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            )}
                          </button>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {!isEditing ? <button className="btn btn-sm btn-secondary" onClick={() => startEdit(u)} disabled={updatingId === u.id || isSelf}>Edit</button> : null}
                      {isEditing ? <button className="btn btn-sm btn-primary" onClick={() => saveEdit(u.id)} disabled={updatingId === u.id}>Save</button> : null}
                      {isEditing ? <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>Cancel</button> : null}
                      <button className="btn btn-sm btn-secondary" onClick={() => requestDelete(u)} disabled={updatingId === u.id || isSelf}>Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa người dùng ${userToDelete?.email}?`}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteConfirmOpen(false); setUserToDelete(null); }}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  )
}

export default AdminUsersPage
