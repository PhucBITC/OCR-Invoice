import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { companyApi } from '../api/companyApi'
import { documentTypeApi } from '../api/documentTypeApi'
import { documentApi } from '../api/documentApi'

function DocumentListPage() {
  const [documents, setDocuments] = useState([])
  const [companies, setCompanies] = useState([])
  const [documentTypes, setDocumentTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter and paging states
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [documentTypeId, setDocumentTypeId] = useState('')
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [compRes, typeRes] = await Promise.all([
          companyApi.getAll(),
          documentTypeApi.getAll(),
        ])
        setCompanies(compRes.data)
        setDocumentTypes(typeRes.data)
      } catch (err) {
        console.error('Failed to load categories', err)
      }
    }
    loadMetadata()
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [page, status, companyId, documentTypeId]) // Trigger fetch on change

  const fetchDocuments = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        size,
        status: status || undefined,
        companyId: companyId || undefined,
        documentTypeId: documentTypeId || undefined,
        search: search ? search.trim() : undefined,
      }
      const res = await documentApi.getAll(params)
      // Spring Data Page object returns data inside res.data.content
      setDocuments(res.data.content || [])
      setTotalPages(res.data.totalPages || 0)
      setTotalElements(res.data.totalElements || 0)
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách tài liệu.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocumentsSilently = async () => {
    try {
      const params = {
        page,
        size,
        status: status || undefined,
        companyId: companyId || undefined,
        documentTypeId: documentTypeId || undefined,
        search: search ? search.trim() : undefined,
      }
      const res = await documentApi.getAll(params)
      setDocuments(res.data.content || [])
      setTotalPages(res.data.totalPages || 0)
      setTotalElements(res.data.totalElements || 0)
    } catch (err) {
      console.error('Silent fetch failed', err)
    }
  }

  // Tự động kiểm tra trạng thái khi tài liệu đang xử lý
  useEffect(() => {
    const hasProcessing = documents.some(
      (doc) => doc.status === 'UPLOADED' || doc.status === 'OCR_PROCESSING'
    )
    if (!hasProcessing) return

    const interval = setInterval(() => {
      fetchDocumentsSilently()
    }, 2000)

    return () => clearInterval(interval)
  }, [documents, page, status, companyId, documentTypeId, search])

  const handleTriggerOcr = async (id) => {
    try {
      setError('')
      await documentApi.triggerOcr(id)
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id ? { ...doc, status: 'OCR_PROCESSING' } : doc
        )
      )
    } catch (err) {
      console.error('Failed to trigger OCR manually', err)
      setError('Không thể kích hoạt quét OCR: ' + (err.message || 'Lỗi hệ thống'))
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    fetchDocuments()
  }

  const handleResetFilters = () => {
    setSearch('')
    setStatus('')
    setCompanyId('')
    setDocumentTypeId('')
    setPage(0)
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN')
  }

  const getStatusBadge = (statusStr) => {
    switch (statusStr) {
      case 'UPLOADED':
        return <span className="status-badge" style={{ background: '#f4f4f5', color: '#71717a' }}>Đã tải lên</span>
      case 'OCR_PROCESSING':
        return <span className="status-badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px dashed #3b82f6', animation: 'pulse 2s infinite' }}>Đang quét OCR</span>
      case 'OCR_DONE':
        return <span className="status-badge" style={{ background: '#ecfdf5', color: '#047857' }}>Đã quét xong</span>
      case 'NEED_REVIEW':
        return <span className="status-badge" style={{ background: '#fffbeb', color: '#d97706' }}>Cần duyệt</span>
      case 'VERIFIED':
        return <span className="status-badge status-active">Đã xác thực</span>
      case 'REJECTED':
        return <span className="status-badge status-inactive">Từ chối</span>
      case 'ERROR':
        return <span className="status-badge" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>Lỗi quét OCR</span>
      default:
        return <span className="status-badge">{statusStr}</span>
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Danh sách tài liệu</h1>
        <p className="page-subtitle">Quản lý, tìm kiếm và xem trạng thái xử lý các tệp hóa đơn chứng từ.</p>
      </div>

      {error && <p className="auth-error" style={{ marginBottom: 16 }}>{error}</p>}

      {/* Filters Toolbar */}
      <div className="table-card" style={{ marginBottom: 24, padding: 16 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          <div className="form-group" style={{ gap: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Tìm kiếm tên tệp</label>
            <input
              type="text"
              placeholder="Nhập tên tệp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ height: 38, fontSize: 13, padding: '0 12px' }}
            />
          </div>

          <div className="form-group" style={{ gap: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Trạng thái</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              style={{ height: 38, fontSize: 13, padding: '0 8px' }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="UPLOADED">Đã tải lên</option>
              <option value="OCR_PROCESSING">Đang quét OCR</option>
              <option value="OCR_DONE">Đã quét xong</option>
              <option value="NEED_REVIEW">Cần duyệt</option>
              <option value="VERIFIED">Đã xác thực</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>

          <div className="form-group" style={{ gap: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Doanh nghiệp</label>
            <select
              value={companyId}
              onChange={(e) => { setCompanyId(e.target.value); setPage(0); }}
              style={{ height: 38, fontSize: 13, padding: '0 8px' }}
            >
              <option value="">Tất cả doanh nghiệp</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gap: 4 }}>
            <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Loại chứng từ</label>
            <select
              value={documentTypeId}
              onChange={(e) => { setDocumentTypeId(e.target.value); setPage(0); }}
              style={{ height: 38, fontSize: 13, padding: '0 8px' }}
            >
              <option value="">Tất cả loại chứng từ</option>
              {documentTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary" style={{ height: 38, padding: '0 16px' }}>
              Lọc
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleResetFilters} style={{ height: 38, padding: '0 16px' }}>
              Đặt lại
            </button>
          </div>
        </form>
      </div>

      {/* Documents Table */}
      <div className="table-card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>
            Đang tải danh sách tài liệu...
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>
            Không tìm thấy chứng từ nào phù hợp.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tên tệp</th>
                    <th>Loại chứng từ</th>
                    <th>Doanh nghiệp</th>
                    <th>Dung lượng</th>
                    <th>Người tải lên</th>
                    <th>Ngày tải</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right', width: '280px', whiteSpace: 'nowrap' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.fileName}>
                        {doc.fileName}
                      </td>
                      <td>{doc.documentTypeName || '-'}</td>
                      <td>{doc.companyName || '-'}</td>
                      <td>{formatSize(doc.fileSize)}</td>
                      <td>{doc.uploadedByFullName}</td>
                      <td>{formatDate(doc.createdAt)}</td>
                      <td>{getStatusBadge(doc.status)}</td>
                       <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                          {(doc.status === 'NEED_REVIEW' || doc.status === 'VERIFIED' || doc.status === 'REJECTED' || doc.status === 'ERROR') && (
                            <Link
                              to={`/documents/${doc.id}/review`}
                              className="btn btn-primary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                              </svg>
                              <span>Soát xét</span>
                            </Link>
                          )}
                          {(doc.status === 'NEED_REVIEW' || doc.status === 'ERROR' || doc.status === 'REJECTED') && (
                            <button
                              onClick={() => handleTriggerOcr(doc.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                              </svg>
                              <span>Quét lại</span>
                            </button>
                          )}
                          <a
                            href={documentApi.getFileUrl(doc.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span>Xem file</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid var(--line)', background: 'var(--paper)' }}>
                <span className="muted" style={{ fontSize: 13 }}>
                  Hiển thị trang {page + 1} / {totalPages} (Tổng số {totalElements} tài liệu)
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Trước
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page === totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DocumentListPage
