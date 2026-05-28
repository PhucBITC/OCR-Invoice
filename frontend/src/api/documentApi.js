import axiosClient from './axiosClient'

export const documentApi = {
  upload: (formData, onUploadProgress) => {
    return axiosClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress, // Pass progress callback for progress bar animation
    })
  },
  getAll: (params) => axiosClient.get('/documents', { params }),
  getById: (id) => axiosClient.get(`/documents/${id}`),
  getFileUrl: (id) => {
    const token = localStorage.getItem('accessToken')
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/documents/${id}/file?token=${token}`
  },
  triggerOcr: (id) => axiosClient.post(`/documents/${id}/ocr`),
  getOcrResult: (id) => axiosClient.get(`/documents/${id}/ocr-result`),
  saveDraft: (id, ocrData) => axiosClient.put(`/documents/${id}/ocr-result`, ocrData),
  verify: (id, ocrData) => axiosClient.post(`/documents/${id}/verify`, ocrData),
  reject: (id, reason) => axiosClient.post(`/documents/${id}/reject`, { reason }),
  getAuditLogs: (id) => axiosClient.get(`/documents/${id}/audit-logs`),
}
