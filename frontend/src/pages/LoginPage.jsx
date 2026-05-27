import { Link } from 'react-router-dom'

function LoginPage() {
  const loginDemo = () => {
    localStorage.setItem('accessToken', 'dev-token')
    window.location.href = '/dashboard'
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>Invoice OCR - Login</h1>
      <p>GD1 placeholder for Google SSO flow.</p>
      <button onClick={loginDemo}>Login Demo</button>
      <p><Link to="/dashboard">Go dashboard</Link></p>
    </main>
  )
}

export default LoginPage
