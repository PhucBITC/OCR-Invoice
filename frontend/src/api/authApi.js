import axiosClient from './axiosClient'

export const authApi = {
  googleLogin: (token) => axiosClient.post('/auth/google', { token }),
  login: (payload) => axiosClient.post('/auth/login', payload),
  register: (payload) => axiosClient.post('/auth/register', payload),
  me: () => axiosClient.get('/auth/me'),
}
