import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { documentApi } from '../api/documentApi'
import { toast } from 'react-toastify'
import ConfirmModal from '../components/common/ConfirmModal'

function DocumentReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Metadata & Status states
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // OCR form states
  const [ocrData, setOcrData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    sellerName: '',
    sellerTaxCode: '',
    buyerName: '',
    buyerTaxCode: '',
    subtotal: 0.0,
    vatAmount: 0.0,
    totalAmount: 0.0,
    paymentMethod: '',
    confidence: 0.0,
    items: []
  })

  // Audit Logs state
  const [logs, setLogs] = useState([])
  const [logsOpen, setLogsOpen] = useState(false)

  // Rejection Modal states
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [verifyConfirmOpen, setVerifyConfirmOpen] = useState(false)

  useEffect(() => {
    loadPageData()
  }, [id])

  const loadPageData = async () => {
    setLoading(true)
    setError('')
    try {
      // Load Doc details
      const docRes = await documentApi.getById(id)
      setDoc(docRes.data)

      // Load OCR Result
      try {
        const ocrRes = await documentApi.getOcrResult(id)
        if (ocrRes.data) {
          setOcrData(ocrRes.data)
        }
      } catch (ocrErr) {
        console.warn('No OCR result found yet or failed to load', ocrErr)
      }

      // Load Audit logs
      try {
        const logRes = await documentApi.getAuditLogs(id)
        setLogs(logRes.data || [])
      } catch (logErr) {
        console.error('Failed to load audit logs', logErr)
      }

    } catch (err) {
      setError(err.message || 'Không thể tải thông tin tài liệu.')
    } finally {
      setLoading(false)
    }
  }

  const reloadLogs = async () => {
    try {
      const logRes = await documentApi.getAuditLogs(id)
      setLogs(logRes.data || [])
    } catch (logErr) {
      console.error('Failed to reload logs', logErr)
    }
  }

  // Row operations
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...ocrData.items]
    const item = { ...updatedItems[index] }

    if (field === 'quantity' || field === 'unitPrice') {
      const numVal = parseFloat(value) || 0
      item[field] = numVal
      item.amount = Math.round(item.quantity * item.unitPrice * 100.0) / 100.0
    } else {
      item[field] = value
    }

    updatedItems[index] = item

    // Recalculate totals
    const newSubtotal = updatedItems.reduce((sum, it) => sum + (it.amount || 0), 0)
    const newVat = Math.round(newSubtotal * 0.10 * 100.0) / 100.0
    const newTotal = newSubtotal + newVat

    setOcrData({
      ...ocrData,
      items: updatedItems,
      subtotal: Math.round(newSubtotal * 100.0) / 100.0,
      vatAmount: newVat,
      totalAmount: Math.round(newTotal * 100.0) / 100.0
    })
  }

  const handleAddItem = () => {
    const newItem = { description: '', quantity: 1.0, unitPrice: 0.0, amount: 0.0 }
    const updatedItems = [...ocrData.items, newItem]
    setOcrData({
      ...ocrData,
      items: updatedItems
    })
  }

  const handleRemoveItem = (index) => {
    const updatedItems = ocrData.items.filter((_, idx) => idx !== index)
    
    // Recalculate totals
    const newSubtotal = updatedItems.reduce((sum, it) => sum + (it.amount || 0), 0)
    const newVat = Math.round(newSubtotal * 0.10 * 100.0) / 100.0
    const newTotal = newSubtotal + newVat

    setOcrData({
      ...ocrData,
      items: updatedItems,
      subtotal: Math.round(newSubtotal * 100.0) / 100.0,
      vatAmount: newVat,
      totalAmount: Math.round(newTotal * 100.0) / 100.0
    })
  }

  // Action handlers
  const handleSaveDraft = async () => {
    console.log('handleSaveDraft clicked, current ocrData:', ocrData);
    setSubmitting(true)
    setError('')
    setSuccessMsg('')
    try {
      console.log('Sending API request with id:', id, 'and data:', ocrData);
      const res = await documentApi.saveDraft(id, ocrData)
      console.log('API response:', res);
      toast.success('Đã lưu bản nháp kết quả chỉnh sửa OCR thành công.')
      await reloadLogs()
    } catch (err) {
      console.error('Save draft error:', err);
      toast.error(err.message || 'Lỗi lưu bản nháp.')
    } finally {
      setSubmitting(false)
    }
  }

  const requestVerify = () => {
    setVerifyConfirmOpen(true)
  }

  const confirmVerify = async () => {
    setVerifyConfirmOpen(false)
    setSubmitting(true)
    setError('')
    try {
      await documentApi.verify(id, ocrData)
      toast.success('Phê duyệt chứng từ thành công!')
      navigate('/documents')
    } catch (err) {
      toast.error(err.message || 'Lỗi phê duyệt hóa đơn.')
      setSubmitting(false)
    }
  }

  const handleRejectSubmit = async (e) => {
    e.preventDefault()
    if (!rejectReason.trim()) {
      toast.error('Vui lòng điền lý do từ chối.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await documentApi.reject(id, rejectReason)
      toast.success('Từ chối chứng từ thành công!')
      setRejectOpen(false)
      navigate('/documents')
    } catch (err) {
      toast.error(err.message || 'Lỗi từ chối tài liệu.')
      setSubmitting(false)
    }
  }

  const getStatusBadge = (statusStr) => {
    switch (statusStr) {
      case 'UPLOADED':
        return <span className="status-badge" style={{ background: '#f4f4f5', color: '#71717a' }}>Đã tải lên</span>
      case 'OCR_PROCESSING':
        return <span className="status-badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px dashed #3b82f6', animation: 'pulse 2s infinite' }}>Đang quét OCR</span>
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

  const getConfidenceColor = (conf) => {
    if (conf >= 0.90) return '#10b981' // Green
    if (conf >= 0.70) return '#f59e0b' // Yellow
    return '#ef4444' // Red
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--ink-soft)' }}>
        Đang tải chi tiết soát xét chứng từ...
      </div>
    )
  }

  const { profile } = useOutletContext()
  const role = profile?.role || 'STAFF'
  const isAdmin = role === 'ADMIN'
  const isStaff = role === 'STAFF'
  const isReviewer = role === 'REVIEWER'
  const isManager = role === 'MANAGER'

  // Decide if fields can be edited
  let isEditable = false
  if (isAdmin) {
    isEditable = doc?.status !== 'VERIFIED'
  } else if (isStaff) {
    isEditable = doc?.status === 'UPLOADED' || doc?.status === 'ERROR' || doc?.status === 'REJECTED'
  }

  const isReadOnly = !isEditable

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
      
      {/* LEFT: File Viewer */}
      <div style={{ width: '45%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--line)', background: '#f8fafc', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>BẢN GỐC CHỨNG TỪ:</span>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)', background: 'white', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--line)' }}>
            {doc?.fileName}
          </span>
        </div>
        
        <div style={{ flex: 1, background: 'white', borderRadius: 8, border: '1px solid var(--line)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {doc?.fileType.includes('image') ? (
            <img 
              src={documentApi.getFileUrl(doc.id)} 
              alt="Hóa đơn gốc" 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 8 }}
            />
          ) : (
            <iframe 
              src={documentApi.getFileUrl(doc.id)} 
              title="File PDF" 
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
        </div>
      </div>

      {/* RIGHT: OCR Editable Form */}
      <div style={{ width: '55%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
        
        {/* Right Header Sticky Info */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Soát xét thông tin OCR</h2>
              {getStatusBadge(doc?.status)}
            </div>
            {doc?.note && doc?.status === 'REJECTED' && (
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>
                Lý do từ chối: {doc.note}
              </p>
            )}
          </div>
          
          {/* Confidence Meter */}
          {ocrData.confidence > 0 && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Độ tin cậy AI:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: getConfidenceColor(ocrData.confidence) }}>
                {Math.round(ocrData.confidence * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Form Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 40px 24px' }}>
          {error && <p className="auth-error" style={{ marginBottom: 16 }}>{error}</p>}
          {successMsg && <p style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>{successMsg}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* INVOICE MAIN FIELDS */}
            <div className="form-group">
              <label>Số hóa đơn</label>
              <input
                type="text"
                value={ocrData.invoiceNumber || ''}
                onChange={(e) => setOcrData({ ...ocrData, invoiceNumber: e.target.value })}
                placeholder="Nhập số hóa đơn..."
                disabled={isReadOnly}
              />
            </div>
            <div className="form-group">
              <label>Ngày lập hóa đơn</label>
              <input
                type="date"
                value={ocrData.invoiceDate || ''}
                onChange={(e) => setOcrData({ ...ocrData, invoiceDate: e.target.value })}
                disabled={isReadOnly}
              />
            </div>
            <div className="form-group">
              <label>Phương thức thanh toán</label>
              <input
                type="text"
                value={ocrData.paymentMethod || ''}
                onChange={(e) => setOcrData({ ...ocrData, paymentMethod: e.target.value })}
                placeholder="Chuyển khoản, tiền mặt..."
                disabled={isReadOnly}
              />
            </div>
            <div className="form-group">
              <label>Độ tin cậy thiết lập (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={ocrData.confidence || ''}
                onChange={(e) => setOcrData({ ...ocrData, confidence: parseFloat(e.target.value) || 0.0 })}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* SELLER & BUYER SECTIONS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* SELLER CARD */}
            <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 16, background: 'var(--paper)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>ĐƠN VỊ BÁN HÀNG</h3>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11 }}>Tên người bán</label>
                <input
                  type="text"
                  value={ocrData.sellerName || ''}
                  onChange={(e) => setOcrData({ ...ocrData, sellerName: e.target.value })}
                  style={{ height: 34, fontSize: 12 }}
                  disabled={isReadOnly}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11 }}>Mã số thuế bán</label>
                <input
                  type="text"
                  value={ocrData.sellerTaxCode || ''}
                  onChange={(e) => setOcrData({ ...ocrData, sellerTaxCode: e.target.value })}
                  style={{ height: 34, fontSize: 12 }}
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* BUYER CARD */}
            <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 16, background: 'var(--paper)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>ĐƠN VỊ MUA HÀNG</h3>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11 }}>Tên người mua</label>
                <input
                  type="text"
                  value={ocrData.buyerName || ''}
                  onChange={(e) => setOcrData({ ...ocrData, buyerName: e.target.value })}
                  style={{ height: 34, fontSize: 12 }}
                  disabled={isReadOnly}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 11 }}>Mã số thuế mua</label>
                <input
                  type="text"
                  value={ocrData.buyerTaxCode || ''}
                  onChange={(e) => setOcrData({ ...ocrData, buyerTaxCode: e.target.value })}
                  style={{ height: 34, fontSize: 12 }}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* GOODS TABLE (LINE ITEMS) */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>DANH MỤC HÀNG HÓA</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, fontSize: 11, padding: '0 8px' }}
                disabled={isReadOnly}
              >
                + Thêm dòng
              </button>
            </div>
            
            <div style={{ border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
                    <th style={{ padding: 10, width: '45%' }}>Tên hàng hóa/dịch vụ</th>
                    <th style={{ padding: 10, width: '12%' }}>Số lượng</th>
                    <th style={{ padding: 10, width: '18%' }}>Đơn giá (đ)</th>
                    <th style={{ padding: 10, width: '18%' }}>Thành tiền (đ)</th>
                    <th style={{ padding: 10, width: '7%', textAlign: 'center' }}>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {ocrData.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--line)', background: 'white' }}>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, padding: '0 6px', border: '1px solid #d1d5db', borderRadius: 4 }}
                          placeholder="Tên sản phẩm..."
                          disabled={isReadOnly}
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          type="number"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, padding: '0 6px', border: '1px solid #d1d5db', borderRadius: 4 }}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input
                          type="number"
                          value={item.unitPrice === 0 ? '' : item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          style={{ width: '100%', height: 30, fontSize: 12, padding: '0 6px', border: '1px solid #d1d5db', borderRadius: 4 }}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--ink)' }}>
                        {(item.amount || 0).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: isReadOnly ? 'not-allowed' : 'pointer', padding: 4 }}
                          disabled={isReadOnly}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {ocrData.items.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: 20, textStyle: 'italic', textAlign: 'center', color: 'var(--ink-soft)' }}>
                        Chưa có mặt hàng nào. Vui lòng bấm "Thêm dòng" để thêm hàng hóa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOTALS OVERVIEW */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 30 }}>
            <div style={{ width: 280, border: '1px solid var(--line)', borderRadius: 8, padding: 16, background: 'var(--paper)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span className="muted">Cộng tiền hàng:</span>
                <span style={{ fontWeight: 600 }}>{(ocrData.subtotal || 0).toLocaleString('vi-VN')} đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, alignItems: 'center' }}>
                <span className="muted">Thuế VAT (10%):</span>
                <input
                  type="number"
                  value={ocrData.vatAmount || 0}
                  onChange={(e) => setOcrData({ ...ocrData, vatAmount: parseFloat(e.target.value) || 0.0, totalAmount: (ocrData.subtotal || 0) + (parseFloat(e.target.value) || 0.0) })}
                  style={{ width: 120, height: 26, fontSize: 12, padding: '0 6px', border: '1px solid #d1d5db', borderRadius: 4, textAlign: 'right' }}
                  disabled={isReadOnly}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 8, fontSize: 14, fontWeight: 700 }}>
                <span>Tổng tiền thanh toán:</span>
                <span style={{ color: 'var(--primary)' }}>{(ocrData.totalAmount || 0).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>

          {/* COLLAPSIBLE AUDIT LOG HISTORY */}
          <div style={{ border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setLogsOpen(!logsOpen)}
              style={{ width: '100%', padding: '12px 16px', background: 'var(--paper)', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
            >
              <span>LỊCH SỬ THAO TÁC ({logs.length})</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: logsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            {logsOpen && (
              <div style={{ padding: 12, background: 'white', borderTop: '1px solid var(--line)', maxHeight: 200, overflowY: 'auto' }}>
                {logs.map((log) => (
                  <div key={log.id} style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span>
                        <strong style={{ color: 'var(--primary)' }}>
                          {log.action === 'OCR_EDIT' ? 'LƯU NHÁP' : log.action === 'VERIFIED' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'}
                        </strong>
                        <span className="muted" style={{ margin: '0 6px' }}>bởi</span>
                        <strong>{log.performedByName}</strong> ({log.performedByEmail})
                      </span>
                      <span className="muted">{new Date(log.performedAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <div style={{ color: '#4b5563', fontStyle: 'italic' }}>{log.details}</div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p style={{ textAlign: 'center', margin: '12px 0', color: 'var(--ink-soft)', fontStyle: 'italic', fontSize: 12 }}>
                    Chưa có lịch sử hoạt động cho tài liệu này.
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM ACTION BAR */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', background: 'var(--paper)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => navigate('/documents')}
            disabled={submitting}
          >
            Quay lại
          </button>
          
          <div style={{ display: 'flex', gap: 12 }}>
            {(isAdmin || isStaff) && isEditable && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSaveDraft}
                disabled={submitting}
              >
                Lưu bản nháp
              </button>
            )}
            {(isAdmin || isReviewer) && doc?.status !== 'VERIFIED' && doc?.status !== 'REJECTED' && (
              <button
                type="button"
                className="btn"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}
                onClick={() => { setRejectReason(''); setRejectOpen(true); }}
                disabled={submitting}
              >
                Từ chối
              </button>
            )}
            {(isAdmin || isReviewer) && doc?.status !== 'VERIFIED' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={requestVerify}
                disabled={submitting}
              >
                Phê duyệt (Verify)
              </button>
            )}
          </div>
        </div>

      </div>

      {/* REJECTION POPUP MODAL */}
      {rejectOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 8, padding: 24, width: 400, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 700 }}>Từ chối chứng từ</h3>
            <form onSubmit={handleRejectSubmit}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Lý do từ chối</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do từ chối cụ thể..."
                  style={{ width: '100%', height: 100, padding: 10, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRejectOpen(false)}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: '#dc2626', color: 'white' }}
                  disabled={submitting}
                >
                  Xác nhận Từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={verifyConfirmOpen}
        title="Xác nhận phê duyệt"
        message="Bạn có chắc chắn muốn phê duyệt hóa đơn này? Dữ liệu sẽ được xuất chính thức."
        onConfirm={confirmVerify}
        onCancel={() => setVerifyConfirmOpen(false)}
        confirmText="Phê duyệt"
        cancelText="Hủy"
        type="primary"
      />
    </div>
  )
}

export default DocumentReviewPage
