import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — brand panel */}
      <div className="hidden md:flex w-1/2 bg-umbc-black flex-col p-8">
        <span className="text-umbc-gold font-bold text-2xl">UMBC Learn</span>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <h2 className="text-white text-4xl font-bold">Welcome back</h2>
          <p className="text-gray-400 text-base mt-3">
            Sign in to access your personalized learning dashboard
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="text-umbc-black text-2xl font-bold mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@umbc.edu"
                className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-yellow-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-umbc-gold text-umbc-black font-semibold py-3 rounded mt-4 hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </form>

          <p className="text-gray-500 text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-yellow-500 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
