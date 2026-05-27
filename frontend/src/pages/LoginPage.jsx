import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { authApi } from '../api/authApi'

function LoginPage() {
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const completeLogin = async (token) => {
    const res = await authApi.googleLogin(token)
    localStorage.setItem('accessToken', res.data.accessToken)
    navigate('/dashboard')
  }

  return (
    <main className="page-shell">
      <section className="card">
        <p className="brand-kicker">Invoice OCR Platform</p>
        <h1 className="page-title">Dang nhap he thong</h1>
        <p className="page-subtitle">Su dung Google SSO cho nhan vien va quan tri vien.</p>

        <div className="section">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              setError('')
              try {
                if (!credentialResponse.credential) {
                  throw new Error('Google credential is missing')
                }
                await completeLogin(credentialResponse.credential)
              } catch (e) {
                setError(e.message)
              }
            }}
            onError={() => setError('Google login failed')}
          />
          {error ? <p className="error">{error}</p> : null}
        </div>
      </section>
    </main>
  )
}

export default LoginPage
