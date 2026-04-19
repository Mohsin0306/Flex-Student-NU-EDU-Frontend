import { Navigate, Route, Routes } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import AdminStudentDetail from './pages/AdminStudentDetail'
import LoginPage from './pages/LoginPage'
import StudentChallanPrintPage from './pages/StudentChallanPrintPage'
import StudentDashboard from './pages/StudentDashboard'
import { getStoredUser, getToken } from './utils/auth'

function ProtectedRoute({ role, children }) {
  const token = getToken()
  const user = getStoredUser()

  if (!token || !user) return <Navigate to="/" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students/:id"
        element={
          <ProtectedRoute role="admin">
            <AdminStudentDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/challan/print/:challanId"
        element={
          <ProtectedRoute role="student">
            <StudentChallanPrintPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
