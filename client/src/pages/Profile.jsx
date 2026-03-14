import Sidebar from '../components/layout/Sidebar';
import PageWrapper from '../components/layout/PageWrapper';

const Profile = () => {
  return (
    <div className="flex min-h-screen bg-umbc-surface">
      <Sidebar />
      <PageWrapper>
        <h1 className="text-2xl font-bold text-umbc-black">My Profile</h1>
        <p className="text-umbc-gray mt-1">
          Manage your account information
        </p>
      </PageWrapper>
    </div>
  );
};

export default Profile;
