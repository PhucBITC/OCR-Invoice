import React from 'react'

function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Đồng ý', 
  cancelText = 'Hủy', 
  type = 'danger' 
}) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ fontSize: '16px' }}>{title}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body" style={{ padding: '20px 24px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink)', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
        <div className="modal-footer" style={{ padding: '12px 24px' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
