import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewProject from './pages/NewProject';
import Recommendations from './pages/Recommendations';
import SavedResources from './pages/SavedResources';
import LearningPaths from './pages/LearningPaths';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageResources from './pages/admin/ManageResources';
import StudentInsights from './pages/admin/StudentInsights';
import NotFound from './pages/NotFound';
import ChatWidget from './components/chat/ChatWidget';

const PublicOnlyRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppInner = () => {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/" element={
          <PublicOnlyRoute><Landing /></PublicOnlyRoute>
        } />

        <Route path="/login" element={
          <PublicOnlyRoute><Login /></PublicOnlyRoute>
        } />
        <Route path="/register" element={
          <PublicOnlyRoute><Register /></PublicOnlyRoute>
        } />

        {/* Student protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-project" element={<NewProject />} />
          <Route path="/recommendations/:projectId" element={<Recommendations />} />
          <Route path="/saved" element={<SavedResources />} />
          <Route path="/learning-paths" element={<LearningPaths />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Admin protected routes */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/resources" element={<ManageResources />} />
          <Route path="/admin/insights" element={<StudentInsights />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {user && <ChatWidget />}
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
