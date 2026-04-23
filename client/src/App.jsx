import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { UIProvider, useUI } from './context/UIContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Sidebar from './components/layout/Sidebar'
import PageWrapper from './components/layout/PageWrapper'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOTP from './pages/VerifyOTP'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import SetPassword from './pages/SetPassword'
import Dashboard from './pages/Dashboard'
import NewProject from './pages/NewProject'
import Recommendations from './pages/Recommendations'
import SavedResources from './pages/SavedResources'
import LearningPaths from './pages/LearningPaths'
import Profile from './pages/Profile'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageResources from './pages/admin/ManageResources'
import AdminMaterials from './pages/admin/AdminMaterials'
import AdminPitches from './pages/admin/AdminPitches'
import StudentInsights from './pages/admin/StudentInsights'
import InstructorDashboard from './pages/instructor/InstructorDashboard'
import ProjectApprovals from './pages/instructor/ProjectApprovals'
import TAPermissions from './pages/instructor/TAPermissions'
import TADashboard from './pages/ta/TADashboard'
import ManageUsers from './pages/admin/ManageUsers'
import RoleAssignment from './pages/admin/RoleAssignment'
import DeptHeadDashboard from './pages/depthead/DeptHeadDashboard'
import NotFound from './pages/NotFound'

// Redirects to /dashboard if user is already authenticated
const PublicOnlyRoute = ({ children }) => {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

// AppLayout lives at module scope so React never unmounts page children
// when sidebar state changes — reads state from UIContext instead of props
const AppLayout = () => {
  const { sidebarOpen, toggleSidebar } = useUI()
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 min-w-0 w-full">
        <PageWrapper isSidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar}>
          <Outlet />
        </PageWrapper>
      </div>
    </div>
  )
}

const AppInner = () => {
  return (
    <Routes>
      {/* Public-only routes — redirect to dashboard if logged in */}
      <Route path="/" element={<PublicOnlyRoute><ErrorBoundary><Landing /></ErrorBoundary></PublicOnlyRoute>} />
      <Route path="/login" element={<PublicOnlyRoute><ErrorBoundary><Login /></ErrorBoundary></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><ErrorBoundary><Register /></ErrorBoundary></PublicOnlyRoute>} />
      <Route path="/verify-otp" element={<PublicOnlyRoute><ErrorBoundary><VerifyOTP /></ErrorBoundary></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ErrorBoundary><ForgotPassword /></ErrorBoundary></PublicOnlyRoute>} />
      <Route path="/reset-password" element={<PublicOnlyRoute><ErrorBoundary><ResetPassword /></ErrorBoundary></PublicOnlyRoute>} />

      {/* Set-password is NOT wrapped in PublicOnlyRoute — Google OAuth users
          are authenticated (have a token) but still need to set a password.
          Wrapping it in PublicOnlyRoute would redirect them to dashboard immediately. */}
      <Route path="/set-password" element={<ErrorBoundary><SetPassword /></ErrorBoundary>} />

      {/* All authenticated routes — role-based redirects handled by Dashboard */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Student routes */}
          <Route path="/dashboard"                    element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="/new-project"                  element={<ErrorBoundary><NewProject /></ErrorBoundary>} />
          <Route path="/recommendations/:projectId"   element={<ErrorBoundary><Recommendations /></ErrorBoundary>} />
          <Route path="/saved"                        element={<ErrorBoundary><SavedResources /></ErrorBoundary>} />
          <Route path="/learning-paths"               element={<ErrorBoundary><LearningPaths /></ErrorBoundary>} />
          <Route path="/profile"                      element={<ErrorBoundary><Profile /></ErrorBoundary>} />
          <Route path="/courses"                      element={<ErrorBoundary><Courses /></ErrorBoundary>} />
          <Route path="/courses/:courseId"            element={<ErrorBoundary><CourseDetail /></ErrorBoundary>} />

          {/* Instructor routes */}
          <Route path="/instructor/dashboard"         element={<ErrorBoundary><InstructorDashboard /></ErrorBoundary>} />
          <Route path="/instructor/approvals"         element={<ErrorBoundary><ProjectApprovals /></ErrorBoundary>} />
          <Route path="/instructor/ta-permissions"    element={<ErrorBoundary><TAPermissions /></ErrorBoundary>} />

          {/* TA routes */}
          <Route path="/ta/dashboard"                 element={<ErrorBoundary><TADashboard /></ErrorBoundary>} />

          {/* Department Head routes */}
          <Route path="/depthead/dashboard"           element={<ErrorBoundary><DeptHeadDashboard /></ErrorBoundary>} />
        </Route>
      </Route>

      {/* Admin protected routes */}
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route element={<AppLayout />}>
          <Route path="/admin/dashboard"  element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
          <Route path="/admin/resources"  element={<ErrorBoundary><ManageResources /></ErrorBoundary>} />
          <Route path="/admin/materials"  element={<ErrorBoundary><AdminMaterials /></ErrorBoundary>} />
          <Route path="/admin/pitches"    element={<ErrorBoundary><AdminPitches /></ErrorBoundary>} />
          <Route path="/admin/insights"   element={<ErrorBoundary><StudentInsights /></ErrorBoundary>} />
          <Route path="/admin/users"      element={<ErrorBoundary><ManageUsers /></ErrorBoundary>} />
          <Route path="/admin/roles"      element={<ErrorBoundary><RoleAssignment /></ErrorBoundary>} />
        </Route>
      </Route>

      <Route path="*" element={<ErrorBoundary><NotFound /></ErrorBoundary>} />
    </Routes>
  )
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <UIProvider>
        <AppInner />
      </UIProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
