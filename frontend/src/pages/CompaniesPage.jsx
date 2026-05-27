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
      <div className="page-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h1 style={{ fontSize: 48, marginBottom: 12 }}>⚠️</h1>
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
    if (!form.name || !form.taxCode) {
      setFormError('Tên công ty và Mã số thuế là bắt buộc.')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      if (modalType === 'add') {
        await companyApi.create(form)
      } else {
        await companyApi.update(currentCompanyId, form)
      }
      setModalOpen(false)
      fetchCompanies()
    } catch (err) {
      setFormError(err.message || 'Có lỗi xảy ra khi lưu thông tin.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công ty này?')) return

    try {
      await companyApi.delete(id)
      fetchCompanies()
    } catch (err) {
      alert(err.message || 'Không thể xóa công ty.')
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
          <p className="brand-kicker" style={{ marginBottom: 4 }}>Quản trị hệ thống</p>
          <h1 className="page-title">Quản lý Công ty</h1>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          ➕ Thêm Công ty
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
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(company)}>
                        ✏️ Sửa
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(company.id)}>
                        🗑️ Xóa
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
    </div>
  )
}

export default CompaniesPage
