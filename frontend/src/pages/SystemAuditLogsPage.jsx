import { useState, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { documentApi } from '../api/documentApi'

function SystemAuditLogsPage() {
  const { profile } = useOutletContext()
  const isAdmin = profile?.role === 'ADMIN'

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [action, setAction] = useState('')
  const [performedByEmail, setPerformedByEmail] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination
  const [page, setPage] = useState(0)
  const [size] = useState(15)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    if (isAdmin) {
      fetchLogs()
    }
  }, [isAdmin, page, action, startDate, endDate])

  const fetchLogs = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        size,
        action: action || undefined,
        performedByEmail: performedByEmail.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }
      const res = await documentApi.getSystemAuditLogs(params)
      if (res.data) {
        setLogs(res.data.content || [])
        setTotalPages(res.data.totalPages || 0)
        setTotalElements(res.data.totalElements || 0)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tải nhật ký hệ thống.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    fetchLogs()
  }

  const handleResetFilters = () => {
    setAction('')
    setPerformedByEmail('')
    setStartDate('')
    setEndDate('')
    setPage(0)
  }

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getActionBadgeClass = (act) => {
    switch (act) {
      case 'VERIFIED':
        return 'status-badge status-active' // Green
      case 'REJECTED':
        return 'status-badge status-inactive' // Red
      case 'OCR_EDIT':
        return 'status-badge' // Neutral Blue/Gray or we can use custom inline styles
      default:
        return 'status-badge'
    }
  }

  const getActionLabel = (act) => {
    switch (act) {
      case 'VERIFIED': return 'Phê duyệt'
      case 'REJECTED': return 'Từ chối'
      case 'OCR_EDIT': return 'Sửa OCR'
      case 'UPLOADED': return 'Tải lên'
      default: return act
    }
  }

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Nhật ký hoạt động hệ thống</h1>
          <p className="muted" style={{ fontSize: '13px', marginTop: 4 }}>
            Theo dõi tất cả lịch sử thao tác dữ liệu và hành động của kế toán trên nền tảng.
          </p>
        </div>
      </div>

      {error && <p className="auth-error" style={{ marginBottom: 16 }}>{error}</p>}

      {/* Filter Card */}
      <div className="table-card" style={{ padding: '20px 24px', marginBottom: 24, borderRadius: 12 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>Tìm theo Email</label>
            <input
              type="text"
              placeholder="nhap.email@invoice.com"
              value={performedByEmail}
              onChange={(e) => setPerformedByEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--ink)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>Hành động</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(0); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--ink)',
                fontSize: 14
              }}
            >
              <option value="">Tất cả hành động</option>
              <option value="OCR_EDIT">Sửa bản nháp OCR</option>
              <option value="VERIFIED">Phê duyệt (Verify)</option>
              <option value="REJECTED">Từ chối (Reject)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--ink)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--ink)'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Lọc
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleResetFilters} style={{ height: '42px', padding: '0 16px' }}>
              Xóa lọc
            </button>
          </div>
        </form>
      </div>

      {/* Logs Table Card */}
      <div className="table-card">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>
            Đang tải dữ liệu nhật ký hệ thống...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>
            Không tìm thấy nhật ký hoạt động nào phù hợp.
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Thời gian</th>
                  <th style={{ width: '220px' }}>Người thực hiện</th>
                  <th style={{ width: '130px' }}>Hành động</th>
                  <th style={{ width: '110px' }}>ID Chứng từ</th>
                  <th>Chi tiết hoạt động</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>
                      {formatDate(log.performedAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{log.performedByName || '-'}</span>
                        <code style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>{log.performedByEmail}</code>
                      </div>
                    </td>
                    <td>
                      <span className={getActionBadgeClass(log.action)}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td>
                      <Link to={`/documents/${log.documentId}/review`} style={{ color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}>
                        #{log.documentId}
                      </Link>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--ink-dark)' }}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                Hiển thị <b>{logs.length}</b> trên tổng số <b>{totalElements}</b> log hoạt động
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  Trang trước
                </button>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Trang {page + 1} / {totalPages || 1}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  Trang sau
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SystemAuditLogsPage
