import Sidebar from '../components/layout/Sidebar';
import PageWrapper from '../components/layout/PageWrapper';

const LearningPaths = () => {
  return (
    <div className="flex min-h-screen bg-umbc-surface">
      <Sidebar />
      <PageWrapper>
        <h1 className="text-2xl font-bold text-umbc-black">Learning Paths</h1>
        <p className="text-umbc-gray mt-1">
          Structured paths to complete your project
        </p>
      </PageWrapper>
    </div>
  );
};

export default LearningPaths;
