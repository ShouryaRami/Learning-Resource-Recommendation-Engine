import Sidebar from '../components/layout/Sidebar';
import PageWrapper from '../components/layout/PageWrapper';

const SavedResources = () => {
  return (
    <div className="flex min-h-screen bg-umbc-surface">
      <Sidebar />
      <PageWrapper>
        <h1 className="text-2xl font-bold text-umbc-black">Saved Resources</h1>
        <p className="text-umbc-gray mt-1">
          All your bookmarked learning materials
        </p>
      </PageWrapper>
    </div>
  );
};

export default SavedResources;
