const StudentInsights = () => {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Insights</h1>
        <p className="text-sm text-gray-500 mt-1">View individual student progress and engagement</p>
      </div>

      <div className="text-center mt-16 flex flex-col items-center">
        <div className="text-6xl">📊</div>
        <h3 className="text-lg font-medium text-gray-600 mt-4">Student Analytics</h3>
        <p className="text-sm text-gray-400 mt-2 max-w-sm text-center">
          Detailed per-student analytics and progress tracking coming in Beta
        </p>
      </div>
    </>
  );
};

export default StudentInsights;
