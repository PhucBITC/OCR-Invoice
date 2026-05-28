import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { authApi } from '../api/authApi'

function LoginPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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

  return (
    <main className="auth-layout">
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-mark">OCR</div>
          <h1 className="auth-title">{mode === 'login' ? 'Đăng nhập Invoice OCR' : 'Tạo tài khoản Invoice OCR'}</h1>
          <p className="auth-switch">
            {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
            </button>
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

            <label>
              <span>Email</span>
              <input
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            <label>
              <span>Mật khẩu</span>
              <input
                type="password"
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>

            <button className="auth-primary" disabled={loading} onClick={handleAuth}>
              {loading ? 'Đang xử lý...' : mode === 'login' ? 'Tiếp tục' : 'Tạo tài khoản'}
            </button>

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
    </main>
  )
}

export default LoginPage
