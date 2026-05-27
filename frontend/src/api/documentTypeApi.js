import axiosClient from './axiosClient'

export const documentTypeApi = {
  getAll: () => axiosClient.get('/document-types'),
}
