import axiosClient from './axiosClient'

export const authApi = {
  googleLogin: (token) => axiosClient.post('/auth/google', { token }),
  me: () => axiosClient.get('/auth/me'),
}
