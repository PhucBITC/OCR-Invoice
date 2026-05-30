import axiosClient from './axiosClient'

export const adminUserApi = {
  getAll: () => axiosClient.get('/admin/users'),
  create: (payload) => axiosClient.post('/admin/users', payload),
  update: (id, payload) => axiosClient.put(`/admin/users/${id}`, payload),
  remove: (id) => axiosClient.delete(`/admin/users/${id}`),
  updateRole: (id, role) => axiosClient.put(`/admin/users/${id}/roles`, { role }),
  updateStatus: (id, status) => axiosClient.put(`/admin/users/${id}/status`, { status }),
}
