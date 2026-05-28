import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { companyApi } from '../api/companyApi'

function CompaniesPage() {
  const { profile } = useOutletContext()
  const isAdmin = profile?.role === 'ADMIN'

  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Modal States
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('add') // 'add' or 'edit'
  const [currentCompanyId, setCurrentCompanyId] = useState(null)
  
  // Delete Modal States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [companyToDelete, setCompanyToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Form States
  const [form, setForm] = useState({ name: '', taxCode: '', address: '', status: 'ACTIVE' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      fetchCompanies()
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

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const res = await companyApi.getAll()
      setCompanies(res.data)
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách công ty.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setForm({ name: '', taxCode: '', address: '', status: 'ACTIVE' })
    setFormError('')
    setModalType('add')
    setModalOpen(true)
  }

  const handleOpenEdit = (company) => {
    setForm({
      name: company.name,
      taxCode: company.taxCode,
      address: company.address || '',
      status: company.status
    })
    setFormError('')
    setCurrentCompanyId(company.id)
    setModalType('edit')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 1. Validate Company Name
    if (!form.name || form.name.trim().length < 2 || form.name.trim().length > 150) {
      setFormError('Tên công ty bắt buộc và phải từ 2 đến 150 ký tự.')
      return
    }

    // 2. Validate Tax Code
    const taxCodeRegex = /^[a-zA-Z0-9-]+$/
    if (!form.taxCode || form.taxCode.trim().length < 5 || form.taxCode.trim().length > 20 || !taxCodeRegex.test(form.taxCode.trim())) {
      setFormError('Mã số thuế bắt buộc từ 5 đến 20 ký tự, chỉ chứa chữ cái, số và dấu gạch ngang (-).')
      return
    }

    // 3. Validate Address
    if (form.address && form.address.trim().length > 255) {
      setFormError('Địa chỉ không được vượt quá 255 ký tự.')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      const payload = {
        name: form.name.trim(),
        taxCode: form.taxCode.trim(),
        address: form.address ? form.address.trim() : null,
        status: form.status
      }

      if (modalType === 'add') {
        await companyApi.create(payload)
      } else {
        await companyApi.update(currentCompanyId, payload)
      }
      setModalOpen(false)
      fetchCompanies()
    } catch (err) {
      setFormError(err.message || 'Có lỗi xảy ra khi lưu thông tin.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestDelete = (company) => {
    setCompanyToDelete(company)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return
    setDeleting(true)
    try {
      await companyApi.delete(companyToDelete.id)
      setDeleteConfirmOpen(false)
      setCompanyToDelete(null)
      fetchCompanies()
    } catch (err) {
      alert(err.message || 'Không thể xóa công ty.')
    } finally {
      setDeleting(false)
    }
  }

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.taxCode.toLowerCase().includes(search.toLowerCase()) ||
    (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  )

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN')
  }

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Quản lý Công ty</h1>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Thêm Công ty</span>
        </button>
      </div>

      {error ? <p className="auth-error" style={{ marginBottom: 16 }}>{error}</p> : null}

      <div className="table-card">
        <div className="table-toolbar">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Tìm kiếm công ty, mã số thuế..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlignment: 'center', color: 'var(--ink-soft)' }}>
            Đang tải danh sách công ty...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div style={{ padding: 40, textAlignment: 'center', color: 'var(--ink-soft)' }}>
            Không tìm thấy công ty nào phù hợp.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên công ty</th>
                <th>Mã số thuế</th>
                <th>Địa chỉ</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id}>
                  <td style={{ fontWeight: 600 }}>{company.name}</td>
                  <td><code>{company.taxCode}</code></td>
                  <td>{company.address || '-'}</td>
                  <td>
                    <span className={`status-badge ${company.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                      {company.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td>{formatDate(company.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(company)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>Sửa</span>
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRequestDelete(company)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        <span>Xóa</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {modalType === 'add' ? 'Thêm công ty mới' : 'Cập nhật thông tin công ty'}
              </h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError ? <p className="auth-error">{formError}</p> : null}
                
                <div className="form-group">
                  <label>Tên công ty *</label>
                  <input
                    type="text"
                    placeholder="Công ty TNHH Giải pháp OCR"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mã số thuế *</label>
                  <input
                    type="text"
                    placeholder="0101234567"
                    value={form.taxCode}
                    onChange={(e) => setForm({ ...form, taxCode: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    placeholder="Số 123 Đường Nguyễn Trãi, Hà Nội"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Tạm dừng</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>Xác nhận xóa</span>
              </h2>
              <button className="modal-close" onClick={() => setDeleteConfirmOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--ink)', lineHeight: 1.4 }}>
                Bạn có chắc chắn muốn xóa công ty <strong>{companyToDelete?.name}</strong>? Hành động này sẽ thực hiện ẩn công ty khỏi danh sách hoạt động.
              </p>
            </div>
            <div className="modal-footer" style={{ padding: '12px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
                Hủy bỏ
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompaniesPage
