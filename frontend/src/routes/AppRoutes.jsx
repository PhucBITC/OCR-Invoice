import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes
