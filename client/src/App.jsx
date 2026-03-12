import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

const RootRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route path="/login" element={
            <PublicOnlyRoute><Login /></PublicOnlyRoute>
          } />
          <Route path="/register" element={
            <PublicOnlyRoute><Register /></PublicOnlyRoute>
          } />

          {/* Student protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard coming soon</div>} />
            <Route path="/new-project" element={<div>New Project coming soon</div>} />
            <Route path="/recommendations/:projectId" element={<div>Recommendations coming soon</div>} />
            <Route path="/saved" element={<div>Saved Resources coming soon</div>} />
            <Route path="/learning-paths" element={<div>Learning Paths coming soon</div>} />
            <Route path="/profile" element={<div>Profile coming soon</div>} />
          </Route>

          {/* Admin protected routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin/dashboard" element={<div>Admin Dashboard coming soon</div>} />
            <Route path="/admin/resources" element={<div>Manage Resources coming soon</div>} />
            <Route path="/admin/insights" element={<div>Student Insights coming soon</div>} />
          </Route>

          <Route path="*" element={
            <div className="min-h-screen bg-umbc-black flex flex-col items-center justify-center">
              <p className="text-white text-xl mb-4">Page not found</p>
              <a href="/dashboard" className="text-umbc-gold hover:underline">Go to Dashboard</a>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
