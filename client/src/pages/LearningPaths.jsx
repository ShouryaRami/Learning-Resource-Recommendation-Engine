import { useNavigate } from 'react-router-dom';

const LearningPaths = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Learning Paths</h1>
        <p className="text-sm text-gray-500 mt-1">Structured paths to complete your project</p>
      </div>

      <div className="text-center mt-16 flex flex-col items-center">
        <div className="text-6xl">🗺️</div>
        <h3 className="text-lg font-medium text-gray-600 mt-4">No learning paths yet</h3>
        <p className="text-sm text-gray-400 mt-2 max-w-xs text-center">
          Generate recommendations for a project to create your structured learning path
        </p>
        <button
          onClick={() => navigate('/new-project')}
          className="mt-6 bg-yellow-400 text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-500"
        >
          Get Started
        </button>
      </div>
    </>
  );
};

export default LearningPaths;
