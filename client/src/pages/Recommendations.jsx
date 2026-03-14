import Sidebar from '../components/layout/Sidebar';
import PageWrapper from '../components/layout/PageWrapper';

const Recommendations = () => {
  return (
    <div className="flex min-h-screen bg-umbc-surface">
      <Sidebar />
      <PageWrapper>
        <h1 className="text-2xl font-bold text-umbc-black">Your Recommendations</h1>
        <p className="text-umbc-gray mt-1">
          Personalized resources based on your project
        </p>
      </PageWrapper>
    </div>
  );
};

export default Recommendations;
