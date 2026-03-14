import Sidebar from '../components/layout/Sidebar';
import PageWrapper from '../components/layout/PageWrapper';

const NewProject = () => {
  return (
    <div className="flex min-h-screen bg-umbc-surface">
      <Sidebar />
      <PageWrapper>
        <h1 className="text-2xl font-bold text-umbc-black">Create New Project</h1>
        <p className="text-umbc-gray mt-1">
          Tell us about your project and we will find the best resources for you
        </p>
      </PageWrapper>
    </div>
  );
};

export default NewProject;
