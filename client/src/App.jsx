import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
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
import StudentInsights from './pages/admin/StudentInsights'
import InstructorDashboard from './pages/instructor/InstructorDashboard'
import ProjectApprovals from './pages/instructor/ProjectApprovals'
import TAPermissions from './pages/instructor/TAPermissions'
import TADashboard from './pages/ta/TADashboard'
import ManageUsers from './pages/admin/ManageUsers'
import NotFound from './pages/NotFound'
import ChatWidget from './components/chat/ChatWidget'

// Redirects to /dashboard if user is already authenticated
const PublicOnlyRoute = ({ children }) => {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

const AppInner = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024)

  // Extract courseId from URL so ChatWidget gets material-grounded context
  // Matches /courses/:courseId and /instructor/courses/:courseId
  const courseIdMatch = location.pathname.match(/\/courses\/([a-f0-9]{24})/)
  const chatCourseId = courseIdMatch ? courseIdMatch[1] : null
  const toggleSidebar = () => setSidebarOpen((prev) => !prev)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const AppLayout = () => (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 min-w-0 w-full">
        <PageWrapper isSidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar}>
          <Outlet />
        </PageWrapper>
      </div>
    </div>
  )

  return (
    <>
      <Routes>
        {/* Public-only routes — redirect to dashboard if logged in */}
        <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        <Route path="/verify-otp" element={<PublicOnlyRoute><VerifyOTP /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
        <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />

        {/* Set-password is NOT wrapped in PublicOnlyRoute — Google OAuth users
            are authenticated (have a token) but still need to set a password.
            Wrapping it in PublicOnlyRoute would redirect them to dashboard immediately. */}
        <Route path="/set-password" element={<SetPassword />} />

        {/* All authenticated routes — role-based redirects handled by Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Student routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-project" element={<NewProject />} />
            <Route path="/recommendations/:projectId" element={<Recommendations />} />
            <Route path="/saved" element={<SavedResources />} />
            <Route path="/learning-paths" element={<LearningPaths />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />

            {/* Instructor routes */}
            <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
            <Route path="/instructor/approvals" element={<ProjectApprovals />} />
            <Route path="/instructor/ta-permissions" element={<TAPermissions />} />

            {/* TA routes */}
            <Route path="/ta/dashboard" element={<TADashboard />} />
          </Route>
        </Route>

        {/* Admin protected routes */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<AppLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/resources" element={<ManageResources />} />
            <Route path="/admin/insights" element={<StudentInsights />} />
            <Route path="/admin/users" element={<ManageUsers />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {user && <ChatWidget courseId={chatCourseId} />}
    </>
  )
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  </BrowserRouter>
)

export default App
