import { useEffect, useState } from 'react'
import { authApi } from '../api/authApi'

function DashboardPage() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    authApi.me().then((res) => setProfile(res.data)).catch(() => setProfile(null))
  }, [])

  return (
    <main style={{ padding: '2rem', fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>Dashboard</h1>
      <p>GD2 base page with authenticated profile.</p>
      {profile ? <pre>{JSON.stringify(profile, null, 2)}</pre> : <p>Loading profile...</p>}
    </main>
  )
}

export default DashboardPage
