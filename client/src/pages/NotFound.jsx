import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-umbc-black flex flex-col items-center justify-center">
      <h1 className="text-white text-3xl font-bold mb-2">404 - Page Not Found</h1>
      <p className="text-gray-400 mb-6">The page you are looking for does not exist</p>
      <Link
        to="/dashboard"
        className="bg-umbc-gold text-umbc-black font-semibold px-6 py-2 rounded hover:bg-yellow-400"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
