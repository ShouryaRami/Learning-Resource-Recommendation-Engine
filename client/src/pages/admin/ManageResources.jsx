import Sidebar from '../../components/layout/Sidebar';
import PageWrapper from '../../components/layout/PageWrapper';

const ManageResources = () => {
  return (
    <div className="flex min-h-screen bg-umbc-surface">
      <Sidebar />
      <PageWrapper>
        <h1 className="text-2xl font-bold text-umbc-black">Manage Resources</h1>
        <p className="text-umbc-gray mt-1">
          Add, edit, and manage learning resources
        </p>
      </PageWrapper>
    </div>
  );
};

export default ManageResources;
