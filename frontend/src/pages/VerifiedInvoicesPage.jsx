import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { documentApi } from '../api/documentApi'

function VerifiedInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  // Pagination
  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Expandable invoice items
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null)
  const [invoiceItems, setInvoiceItems] = useState({}) // { [headerId]: itemsList }
  const [loadingItems, setLoadingItems] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [page])

  const fetchInvoices = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        size,
        invoiceNumber: invoiceNumber.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      }
      const res = await documentApi.getVerifiedInvoices(params)
      if (res.data) {
        setInvoices(res.data.content || [])
        setTotalPages(res.data.totalPages || 0)
        setTotalElements(res.data.totalElements || 0)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tải danh sách hóa đơn đã duyệt.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(0)
    fetchInvoices()
  }

  const handleResetFilters = () => {
    setInvoiceNumber('')
    setStartDate('')
    setEndDate('')
    setMinAmount('')
    setMaxAmount('')
    setPage(0)
  }

  const toggleExpandInvoice = async (invoiceId) => {
    if (expandedInvoiceId === invoiceId) {
      setExpandedInvoiceId(null)
      return
    }

    setExpandedInvoiceId(invoiceId)

    // If items already fetched, don't fetch again
    if (invoiceItems[invoiceId]) {
      return
    }

    setLoadingItems(true)
    try {
      const res = await documentApi.getVerifiedInvoiceItems(invoiceId)
      if (res.data) {
        setInvoiceItems(prev => ({
          ...prev,
          [invoiceId]: res.data
        }))
      }
    } catch (err) {
      console.error('Failed to load items for invoice ' + invoiceId, err)
    } finally {
      setLoadingItems(false)
    }
  }

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN')
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('vi-VN')
  }

  return (
    <div className="page-container">
      <div className="topbar" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Hóa đơn đã duyệt đối soát</h1>
          <p className="muted" style={{ fontSize: '13px', marginTop: 4 }}>
            Xem và đối soát dữ liệu của tất cả hóa đơn đã duyệt thành công trên hệ thống.
          </p>
        </div>
      </div>

      {error && <p className="auth-error" style={{ marginBottom: 16 }}>{error}</p>}

      {/* Filter Form Card */}
      <div className="filter-card">
        <form onSubmit={handleSearchSubmit} className="filter-grid">
          <div className="filter-field">
            <label className="filter-label">Số hóa đơn</label>
            <input
              type="text"
              placeholder="Ví dụ: INV-2026-66"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-field">
            <label className="filter-label">Duyệt từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-field">
            <label className="filter-label">Duyệt đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-field">
            <label className="filter-label">Tổng tiền tối thiểu</label>
            <input
              type="number"
              placeholder="đ"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-field">
            <label className="filter-label">Tổng tiền tối đa</label>
            <input
              type="number"
              placeholder="đ"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="filter-input"
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Tìm kiếm
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleResetFilters} style={{ height: '42px', padding: '0 16px' }}>
              Xóa lọc
            </button>
          </div>
        </form>
      </div>

      {/* Verified Invoices Table */}
      <div className="table-card">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>
            Đang tải danh sách hóa đơn đã duyệt...
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>
            Không tìm thấy hóa đơn nào đã được xác thực.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ whiteSpace: 'nowrap' }}>Số hóa đơn</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Ngày hóa đơn</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Đơn vị bán / MST</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Đơn vị mua / MST</th>
                    <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Tổng cộng tiền</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Thanh toán</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Người duyệt</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Thời gian duyệt</th>
                    <th style={{ textAlign: 'right', width: '150px', whiteSpace: 'nowrap' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const isExpanded = expandedInvoiceId === inv.id
                    return (
                      <Fragment key={inv.id}>
                        <tr className={isExpanded ? 'active-row' : ''} style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border)' }}>
                          <td style={{ fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                              </svg>
                              {inv.invoiceNumber || 'Chưa rõ'}
                            </div>
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                            {inv.invoiceDate || '-'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '180px', maxWidth: '240px' }}>
                              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={inv.sellerName}>{inv.sellerName || '-'}</span>
                              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>MST: {inv.sellerTaxCode || '-'}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '180px', maxWidth: '240px' }}>
                              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={inv.buyerName}>{inv.buyerName || '-'}</span>
                              <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>MST: {inv.buyerTaxCode || '-'}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--emerald)', whiteSpace: 'nowrap' }}>
                            {formatCurrency(inv.totalAmount)}
                          </td>
                          <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(29, 78, 216, 0.08)',
                              color: 'var(--blue)',
                              fontWeight: 600,
                              fontSize: '11px'
                            }}>
                              {inv.paymentMethod || 'Tiền mặt'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                              <span style={{ fontWeight: 600 }}>{inv.verifiedByFullName || '-'}</span>
                              <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>{inv.verifiedByEmail || '-'}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '13px', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                            {formatDateTime(inv.verifiedAt)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => toggleExpandInvoice(inv.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: '32px', whiteSpace: 'nowrap' }}
                              >
                                <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease'
                                  }}
                                >
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                              </button>
                              <Link
                                to={`/documents/${inv.documentId}/review`}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', padding: 0 }}
                                title="Xem lại tệp gốc"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                              </Link>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr style={{ background: 'var(--bg-glass)' }}>
                            <td colSpan="9" style={{ padding: '20px 24px', background: 'rgba(29, 78, 216, 0.01)' }}>
                              <div style={{
                                background: '#ffffff',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
                                padding: '24px',
                                animation: 'fadeIn 0.2s ease'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="8" y1="6" x2="21" y2="6"></line>
                                      <line x1="8" y1="12" x2="21" y2="12"></line>
                                      <line x1="8" y1="18" x2="21" y2="18"></line>
                                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                    </svg>
                                    Danh mục hàng hóa / Dịch vụ chi tiết
                                  </h3>
                                  <span style={{
                                    fontSize: '11px',
                                    color: 'var(--blue)',
                                    fontWeight: 700,
                                    background: 'rgba(29, 78, 216, 0.08)',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    Số lượng mặt hàng: {invoiceItems[inv.id]?.length || 0}
                                  </span>
                                </div>

                                {loadingItems ? (
                                  <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
                                    <div className="spinner" style={{
                                      display: 'inline-block',
                                      width: 24,
                                      height: 24,
                                      border: '2.5px solid var(--border)',
                                      borderTopColor: 'var(--blue)',
                                      borderRadius: '50%',
                                      animation: 'spin 0.8s linear infinite',
                                      marginBottom: 10
                                    }} />
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>Đang tải chi tiết hàng hóa...</p>
                                  </div>
                                ) : !invoiceItems[inv.id] || invoiceItems[inv.id].length === 0 ? (
                                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '13px' }}>
                                    Không có thông tin chi tiết sản phẩm cho hóa đơn này.
                                  </div>
                                ) : (
                                  <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table" style={{ background: 'transparent', boxShadow: 'none', borderCollapse: 'separate', borderSpacing: '0 6px', minWidth: '800px' }}>
                                      <thead>
                                        <tr style={{ background: 'rgba(29, 78, 216, 0.03)' }}>
                                          <th style={{ padding: '10px 14px', borderRadius: '8px 0 0 8px', borderBottom: 'none', color: 'var(--ink)', fontSize: 13, fontWeight: 700 }}>Tên mặt hàng / Dịch vụ</th>
                                          <th style={{ width: '120px', textAlign: 'right', padding: '10px 14px', borderBottom: 'none', color: 'var(--ink)', fontSize: 13, fontWeight: 700 }}>Số lượng</th>
                                          <th style={{ width: '180px', textAlign: 'right', padding: '10px 14px', borderBottom: 'none', color: 'var(--ink)', fontSize: 13, fontWeight: 700 }}>Đơn giá</th>
                                          <th style={{ width: '200px', textAlign: 'right', padding: '10px 14px', borderRadius: '0 8px 8px 0', borderBottom: 'none', color: 'var(--ink)', fontSize: 13, fontWeight: 700 }}>Thành tiền</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {invoiceItems[inv.id].map((item, idx) => (
                                          <tr key={idx} style={{ background: 'rgba(0, 0, 0, 0.01)', borderRadius: '6px' }}>
                                            <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--ink)', borderBottom: 'none', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px' }}>
                                              {item.description}
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--ink-soft)', borderBottom: 'none' }}>
                                              {item.quantity || 0}
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--ink-soft)', borderBottom: 'none' }}>
                                              {formatCurrency(item.unitPrice)}
                                            </td>
                                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 750, color: 'var(--ink)', borderBottom: 'none', borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }}>
                                              {formatCurrency(item.amount)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                Hiển thị <b>{invoices.length}</b> trên tổng số <b>{totalElements}</b> hóa đơn
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

export default VerifiedInvoicesPage
