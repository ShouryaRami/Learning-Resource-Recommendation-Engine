import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div>
      {/* Hero */}
      <section className="min-h-screen bg-umbc-black flex flex-col">
        <div className="px-8 py-6">
          <span className="text-umbc-gold font-bold text-xl">UMBC Learn</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-white font-bold text-5xl leading-tight">
            Smart Learning Starts Here.
          </h1>
          <p className="text-gray-400 text-xl mt-6" style={{ maxWidth: '600px' }}>
            Get personalized project guidance, curated learning resources, and
            structured paths to help you succeed in your academic journey at UMBC.
          </p>
          <div className="flex gap-4 mt-10">
            <Link
              to="/register"
              className="bg-umbc-gold text-umbc-black font-semibold px-6 py-3 rounded hover:bg-yellow-400 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="border border-umbc-gold text-umbc-gold px-6 py-3 rounded hover:bg-gray-900 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <h2 className="text-umbc-black text-3xl font-bold">
              Powerful Features for Your Success
            </h2>
            <p className="text-umbc-gray text-lg mt-2">
              Everything you need to plan, learn, and build amazing projects
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-umbc-black">Personalized Recommendations</h3>
              <p className="text-umbc-gray text-sm mt-2">
                Get tailored library and tool suggestions based on your project
                requirements and skill level
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-umbc-black">SLIB Integration</h3>
              <p className="text-umbc-gray text-sm mt-2">
                Access UMBC library resources including books, journals, and
                research databases
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-umbc-black">AI Guidance</h3>
              <p className="text-umbc-gray text-sm mt-2">
                Chat with an AI assistant for project planning help and
                technical guidance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-umbc-black py-8">
        <p className="text-center text-gray-500 text-sm">
          UMBC Learn — SENG 701 Capstone 2026
        </p>
      </footer>
    </div>
  );
};

export default Landing;
