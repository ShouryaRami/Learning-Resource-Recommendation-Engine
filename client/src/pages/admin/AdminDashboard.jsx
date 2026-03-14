import Sidebar from '../../components/layout/Sidebar';
import PageWrapper from '../../components/layout/PageWrapper';

const AdminDashboard = () => {
  return (
    <div className="flex min-h-screen bg-umbc-surface">
      <Sidebar />
      <PageWrapper>
        <h1 className="text-2xl font-bold text-umbc-black">Faculty Dashboard</h1>
        <p className="text-umbc-gray mt-1">
          Analytics and insights on student learning patterns
        </p>
      </PageWrapper>
    </div>
  );
};

export default AdminDashboard;
