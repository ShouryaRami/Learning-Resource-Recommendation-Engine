import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import PageWrapper from '../components/layout/PageWrapper';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-umbc-surface">
      <Sidebar />
      <PageWrapper>
        <h1 className="text-2xl font-bold text-umbc-black">
          Welcome back, {user?.fullName}
        </h1>
        <p className="text-umbc-gray mt-1">
          Here are your recent projects and recommendations
        </p>
      </PageWrapper>
    </div>
  );
};

export default Dashboard;
