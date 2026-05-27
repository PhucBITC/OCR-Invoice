import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { authApi } from '../api/authApi'

function LoginPage() {
  const [tokenInput, setTokenInput] = useState('dev-google-token')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError('')
    try {
      const res = await authApi.googleLogin(tokenInput)
      localStorage.setItem('accessToken', res.data.accessToken)
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>Invoice OCR - Login</h1>
      <p>GD2: login thong qua /api/auth/google (dev token mode).</p>
      <input
        value={tokenInput}
        onChange={(e) => setTokenInput(e.target.value)}
        placeholder="Google token"
        style={{ width: '360px', marginRight: '8px' }}
      />
      <button onClick={handleLogin}>Login</button>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      <p><Link to="/dashboard">Go dashboard</Link></p>
    </main>
  )
}

export default LoginPage
