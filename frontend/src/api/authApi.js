import axiosClient from './axiosClient'

export const authApi = {
  googleLogin: (token) => axiosClient.post('/auth/google', { token }),
  login: (payload) => axiosClient.post('/auth/login', payload),
  register: (payload) => axiosClient.post('/auth/register', payload),
  me: () => axiosClient.get('/auth/me'),
  changePassword: (payload) => axiosClient.post('/auth/change-password', payload),
  forgotPassword: (email) => axiosClient.post('/auth/forgot-password', { email }),
  verifyOtp: (payload) => axiosClient.post('/auth/verify-otp', payload),
  resetPassword: (payload) => axiosClient.post('/auth/reset-password', payload),
  updateProfile: (payload) => axiosClient.put('/auth/profile', payload),
}
