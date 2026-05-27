import axiosClient from './axiosClient'

export const companyApi = {
  getAll: () => axiosClient.get('/companies'),
  getById: (id) => axiosClient.get(`/companies/${id}`),
  create: (payload) => axiosClient.post('/companies', payload),
  update: (id, payload) => axiosClient.put(`/companies/${id}`, payload),
  delete: (id) => axiosClient.delete(`/companies/${id}`),
}
