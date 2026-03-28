import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import PageWrapper from '../components/layout/PageWrapper';
import { createProject } from '../api/projects';
import { getRecommendations } from '../api/recommendations';

const NewProject = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [language, setLanguage] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [timeline, setTimeline] = useState('1month');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !domain || !language || !skillLevel) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const project = await createProject({
        title, domain, language, skillLevel, timeline, description,
      });
      const result = await getRecommendations({
        domain, language, skillLevel, timeline,
        description, projectId: project._id,
      });
      localStorage.setItem(
        'umbc_recommendations_' + project._id,
        JSON.stringify({
          ranked: result.ranked,
          learningPath: result.learningPath,
          totalFound: result.totalFound,
        })
      );
      navigate('/recommendations/' + project._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent';

  return (
    <div className="flex min-h-screen bg-umbc-surface">
      <Sidebar />
      <PageWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h1 className="text-xl font-bold text-umbc-black mb-1">Create New Project</h1>
              <p className="text-sm text-gray-500 mb-6">
                Tell us about your project and we will find the best resources for you
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. E-commerce Website"
                    className={inputClass}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Domain <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className={inputClass}
                  >
                    <option value="" disabled>Select a domain</option>
                    <option value="web">Web Development</option>
                    <option value="mobile">Mobile Development</option>
                    <option value="ml">Machine Learning</option>
                    <option value="data">Data Science</option>
                    <option value="security">Security</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Programming Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={inputClass}
                  >
                    <option value="" disabled>Select a language</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="typescript">TypeScript</option>
                    <option value="any">Any / Undecided</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skill Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                    className={inputClass}
                  >
                    <option value="" disabled>Select skill level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Timeline
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className={inputClass}
                  >
                    <option value="1week">1 Week</option>
                    <option value="2weeks">2 Weeks</option>
                    <option value="1month">1 Month</option>
                    <option value="3months">3 Months</option>
                    <option value="semester">Full Semester</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your project goals, key features, and any specific requirements..."
                    className={inputClass}
                  />
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-semibold text-black transition-colors ${
                    loading
                      ? 'bg-yellow-200 cursor-not-allowed'
                      : 'bg-yellow-400 hover:bg-yellow-500'
                  }`}
                >
                  {loading ? 'Generating...' : 'Generate Recommendations'}
                </button>
              </form>
            </div>
          </div>

          {/* Right — tips */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-800 mb-4">
                Tips for Better Recommendations
              </h2>
              <div className="border-l-4 border-yellow-400 pl-4">
                <ul className="list-none space-y-3">
                  <li className="text-sm text-gray-600">
                    Be specific about your project goals and features
                  </li>
                  <li className="text-sm text-gray-600">
                    Mention any technical requirements or constraints
                  </li>
                  <li className="text-sm text-gray-600">
                    Include information about your target audience
                  </li>
                  <li className="text-sm text-gray-600">
                    Select the skill level that matches your abilities
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-black rounded-lg p-4 mt-4">
              <p className="font-semibold text-yellow-400 text-sm">
                Need help getting started?
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Use the AI chat assistant for project planning guidance
              </p>
            </div>
          </div>

        </div>
      </PageWrapper>
    </div>
  );
};

export default NewProject;
