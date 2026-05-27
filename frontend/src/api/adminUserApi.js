import axiosClient from './axiosClient'

export const adminUserApi = {
  getAll: () => axiosClient.get('/admin/users'),
  updateRole: (id, role) => axiosClient.put(`/admin/users/${id}/roles`, { role }),
  updateStatus: (id, status) => axiosClient.put(`/admin/users/${id}/status`, { status }),
}
