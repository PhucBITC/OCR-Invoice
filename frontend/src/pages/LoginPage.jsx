import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { authApi } from '../api/authApi'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function LoginPage() {
  const [mode, setMode] = useState('login') // 'login', 'register', 'forgot_password', 'reset_password'
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setShowPassword(false)
    setShowNewPassword(false)
    setShowConfirmNewPassword(false)
  }, [mode])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      navigate('/dashboard')
    }
  }, [navigate])

  const completeGoogleLogin = async (token) => {
    const res = await authApi.googleLogin(token)
    localStorage.setItem('accessToken', res.data.accessToken)
    navigate('/dashboard')
  }

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = { email: form.email, password: form.password }
      const res = mode === 'login'
        ? await authApi.login(payload)
        : await authApi.register({ ...payload, fullName: form.fullName })
      localStorage.setItem('accessToken', res.data.accessToken)
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!form.email) {
      setError('Vui lòng nhập Email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(form.email)
      toast.success('Mã OTP đã được gửi về hòm thư của bạn!')
      setMode('verify_otp')
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!form.email || !otp) {
      setError('Vui lòng nhập mã OTP.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authApi.verifyOtp({
        email: form.email,
        otp
      })
      toast.success('Mã OTP hợp lệ! Vui lòng thiết lập mật khẩu mới.')
      setMode('reset_password')
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!form.email || !otp || !newPassword) {
      setError('Vui lòng điền đầy đủ các thông tin.')
      return
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu mới không khớp.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authApi.resetPassword({
        email: form.email,
        otp,
        newPassword
      })
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.')
      setMode('login')
      setForm({ ...form, password: '' })
      setOtp('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-mark">OCR</div>
          <h1 className="auth-title">
            {mode === 'login' 
              ? 'Đăng nhập Invoice OCR' 
              : mode === 'register' 
              ? 'Tạo tài khoản Invoice OCR'
              : mode === 'forgot_password'
              ? 'Quên mật khẩu'
              : mode === 'verify_otp'
              ? 'Xác thực mã OTP'
              : 'Đặt lại mật khẩu'}
          </h1>
          <p className="auth-switch">
            {mode === 'login' && (
              <>
                Chưa có tài khoản?{' '}
                <button type="button" onClick={() => { setMode('register'); setError(''); }}>Đăng ký</button>
              </>
            )}
            {mode === 'register' && (
              <>
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); }}>Đăng nhập</button>
              </>
            )}
            {(mode === 'forgot_password' || mode === 'verify_otp' || mode === 'reset_password') && (
              <button type="button" onClick={() => { setMode('login'); setError(''); }}>Quay lại đăng nhập</button>
            )}
          </p>

          <div className="auth-fields">
            {mode === 'register' && (
              <label>
                <span>Họ và tên</span>
                <input
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </label>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot_password' || mode === 'verify_otp' || mode === 'reset_password') && (
              <label>
                <span>Email</span>
                <input
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={mode === 'verify_otp' || mode === 'reset_password'}
                />
              </label>
            )}

            {(mode === 'login' || mode === 'register') && (
              <label>
                <span>Mật khẩu</span>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={{ paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--ink-soft, #8f8f8d)',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      outline: 'none'
                    }}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    )}
                  </button>
                </div>
              </label>
            )}

            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => { setMode('forgot_password'); setError(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--blue, #2563eb)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {mode === 'verify_otp' && (
              <label>
                <span>Mã OTP (6 chữ số)</span>
                <input
                  placeholder="Nhập mã OTP từ email của bạn"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </label>
            )}

            {mode === 'reset_password' && (
              <>
                <label>
                  <span>Mật khẩu mới</span>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--ink-soft, #8f8f8d)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none'
                      }}
                    >
                      {showNewPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      )}
                    </button>
                  </div>
                </label>
                <label>
                  <span>Xác nhận mật khẩu mới</span>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      style={{ paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--ink-soft, #8f8f8d)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none'
                      }}
                    >
                      {showConfirmNewPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      )}
                    </button>
                  </div>
                </label>
              </>
            )}

            {(mode === 'login' || mode === 'register') && (
              <button className="auth-primary" disabled={loading} onClick={handleAuth}>
                {loading ? 'Đang xử lý...' : mode === 'login' ? 'Tiếp tục' : 'Tạo tài khoản'}
              </button>
            )}

            {mode === 'forgot_password' && (
              <button className="auth-primary" disabled={loading} onClick={handleForgotPassword}>
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </button>
            )}

            {mode === 'verify_otp' && (
              <button className="auth-primary" disabled={loading} onClick={handleVerifyOtp}>
                {loading ? 'Đang xác minh...' : 'Xác minh OTP'}
              </button>
            )}

            {mode === 'reset_password' && (
              <button className="auth-primary" disabled={loading} onClick={handleResetPassword}>
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            )}

            {(mode === 'login' || mode === 'register') && (
              <>
                <div className="auth-divider">
                  <span />
                  <small>OR</small>
                  <span />
                </div>

                <div className="auth-google-native">
                  <GoogleLogin
                    width="420"
                    text="continue_with"
                    shape="rectangular"
                    onSuccess={async (credentialResponse) => {
                      setError('')
                      try {
                        if (!credentialResponse.credential) throw new Error('Google credential is missing')
                        await completeGoogleLogin(credentialResponse.credential)
                      } catch (e) {
                        setError(e.message)
                      }
                    }}
                    onError={() => setError('Google login failed')}
                  />
                </div>
              </>
            )}

            {error ? <p className="auth-error">{error}</p> : null}
          </div>
        </div>
      </section>

      <section className="auth-visual-panel" aria-hidden="true">
        <div className="lotus-stage">
          <div className="light-ribbon light-ribbon-one" />
          <div className="light-ribbon light-ribbon-two" />
          <div className="glass-lotus">
            <span className="petal petal-1" />
            <span className="petal petal-2" />
            <span className="petal petal-3" />
            <span className="petal petal-4" />
            <span className="petal petal-5" />
            <span className="petal petal-6" />
            <span className="petal petal-7" />
            <span className="petal petal-8" />
            <span className="lotus-core" />
            <span className="lotus-stem" />
          </div>
        </div>
      </section>
      <ToastContainer position="top-right" autoClose={4000} theme="light" />
    </main>
  )
}

export default LoginPage
