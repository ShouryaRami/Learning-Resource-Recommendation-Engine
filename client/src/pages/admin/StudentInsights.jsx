import Sidebar from '../../components/layout/Sidebar';
import PageWrapper from '../../components/layout/PageWrapper';

const StudentInsights = () => {
  return (
    <div className="flex min-h-screen bg-umbc-surface">
      <Sidebar />
      <PageWrapper>
        <h1 className="text-2xl font-bold text-umbc-black">Student Insights</h1>
        <p className="text-umbc-gray mt-1">
          View individual student progress and engagement
        </p>
      </PageWrapper>
    </div>
  );
};

export default StudentInsights;
