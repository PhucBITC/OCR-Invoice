import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import CompaniesPage from '../pages/CompaniesPage'
import AdminUsersPage from '../pages/AdminUsersPage'
import UploadDocumentPage from '../pages/UploadDocumentPage'
import DocumentListPage from '../pages/DocumentListPage'
import DocumentReviewPage from '../pages/DocumentReviewPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadDocumentPage />} />
        <Route path="/documents" element={<DocumentListPage />} />
        <Route path="/documents/:id/review" element={<DocumentReviewPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes
