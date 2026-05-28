import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { companyApi } from '../api/companyApi'
import { documentTypeApi } from '../api/documentTypeApi'
import { documentApi } from '../api/documentApi'

function UploadDocumentPage() {
  const navigate = useNavigate()
  
  // Lists
  const [companies, setCompanies] = useState([])
  const [documentTypes, setDocumentTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form states
  const [file, setFile] = useState(null)
  const [companyId, setCompanyId] = useState('')
  const [documentTypeId, setDocumentTypeId] = useState('')
  const [note, setNote] = useState('')

  // Drag and drop states
  const [dragOver, setDragOver] = useState(false)

  // Upload progress states
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)

  const fileInputRef = useRef(null)

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
        setError('Không thể tải cấu hình danh mục dữ liệu.')
      } finally {
        setLoading(false)
      }
    }
    loadMetadata()
  }, [])

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (selectedFile) => {
    setError('')
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Hệ thống chỉ hỗ trợ tệp định dạng PDF, JPEG hoặc PNG.')
      return
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('Dung lượng tệp vượt quá giới hạn tối đa là 20MB.')
      return
    }
    setFile(selectedFile)
    setSuccess(false)
  }

  const removeFile = () => {
    setFile(null)
    setProgress(0)
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Vui lòng chọn tệp tài liệu trước.')
      return
    }

    setUploading(true)
    setProgress(0)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    if (companyId) formData.append('companyId', companyId)
    if (documentTypeId) formData.append('documentTypeId', documentTypeId)
    if (note) formData.append('note', note)

    try {
      await documentApi.upload(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setProgress(percentCompleted)
      })
      setSuccess(true)
      setTimeout(() => {
        navigate('/documents')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Lỗi xảy ra trong quá trình tải tệp lên.')
      setUploading(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: 80 }}>
        <p className="muted">Đang tải cấu hình danh mục tải tệp...</p>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title">Tải lên chứng từ</h1>
        <p className="page-subtitle">Chọn hoặc kéo thả tệp hóa đơn chứng từ mới để thực hiện trích xuất dữ liệu OCR.</p>
      </div>

      {error && <p className="auth-error" style={{ marginBottom: 16 }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* Left Form Part: Drag and drop */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            className={`upload-dropzone ${dragOver ? 'dragover' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={uploading}
            />

            {!file ? (
              <div className="dropzone-content">
                <div className="dropzone-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <h3>Kéo thả tệp vào đây</h3>
                <p className="muted">hoặc nhấp chuột để chọn tệp từ máy tính</p>
                <span className="file-types-hint">Định dạng hỗ trợ: PDF, JPEG, PNG (Tối đa 20MB)</span>
              </div>
            ) : (
              <div className="file-preview-card">
                <div className="file-preview-icon">
                  {file.type === 'application/pdf' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  )}
                </div>
                <div className="file-preview-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatSize(file.size)}</span>
                </div>
                {!uploading && (
                  <button type="button" className="file-remove-btn" onClick={removeFile}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Progress state */}
          {uploading && (
            <div className="progress-container">
              <div className="progress-header">
                <span>{success ? 'Tải lên hoàn thành!' : 'Đang tải tệp lên...'}</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar-bg">
                <div className={`progress-bar-fill ${success ? 'success' : ''}`} style={{ width: `${progress}%` }}></div>
              </div>
              {success && (
                <div className="success-banner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Lưu chứng từ thành công! Đang chuyển hướng...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Metadata Form Part */}
        <form onSubmit={handleSubmit} className="table-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px 0', borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
            Thông tin đính kèm
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Doanh nghiệp liên kết</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={uploading}
              >
                <option value="">-- Chọn doanh nghiệp --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.taxCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Loại chứng từ</label>
              <select
                value={documentTypeId}
                onChange={(e) => setDocumentTypeId(e.target.value)}
                disabled={uploading}
              >
                <option value="">-- Chọn loại chứng từ --</option>
                {documentTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Ghi chú</label>
              <textarea
                placeholder="Nhập ghi chú thêm cho chứng từ này..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={uploading}
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: 8, height: 44 }}
              disabled={uploading || !file}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>{uploading ? 'Đang xử lý...' : 'Bắt đầu Tải lên'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UploadDocumentPage
