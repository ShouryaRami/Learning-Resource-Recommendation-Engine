import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResourceCard from '../components/cards/ResourceCard';
import { saveResource } from '../api/saved';
import LoadingSpinner from '../components/LoadingSpinner';

const TYPE_SECTION_LABELS = {
  documentation: '📄 Documentation',
  tutorial: '🎓 Tutorials',
  github: '💻 Code Examples',
  video: '🎬 Videos',
  article: '📝 Articles',
};

const TYPE_ORDER = ['documentation', 'tutorial', 'github', 'video', 'article'];

const Recommendations = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [ranked, setRanked] = useState([]);
  const [learningPath, setLearningPath] = useState([]);
  const [totalFound, setTotalFound] = useState(0);
  const [activeTab, setActiveTab] = useState('ranked');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('umbc_recommendations_' + projectId);
    if (!stored) {
      setError('No recommendations found for this project. Please generate recommendations from the New Project page.');
      setLoading(false);
      return;
    }
    const data = JSON.parse(stored);
    setRanked(data.ranked);
    setLearningPath(data.learningPath);
    setTotalFound(data.totalFound);
    setLoading(false);
  }, []);

  const handleSave = async (resourceId) => {
    try {
      await saveResource(resourceId, projectId);
    } catch {
      // ResourceCard handles visual state
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => navigate('/new-project')}
          className="mt-4 bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500"
        >
          Create New Project
        </button>
      </div>
    );
  }

  const grouped = TYPE_ORDER.reduce((acc, type) => {
    const items = learningPath.filter((r) => r.resourceType === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {});

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-umbc-black">Your Recommendations</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalFound} resources found for your project
            </p>
          </div>
          <button
            onClick={() => navigate('/new-project')}
            className="border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded hover:bg-gray-50 transition-colors"
          >
            New Search
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('ranked')}
              className={`pb-2 mr-6 text-sm transition-colors ${
                activeTab === 'ranked'
                  ? 'border-b-2 border-yellow-400 text-yellow-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Ranked List
            </button>
            <button
              onClick={() => setActiveTab('learningPath')}
              className={`pb-2 text-sm transition-colors ${
                activeTab === 'learningPath'
                  ? 'border-b-2 border-yellow-400 text-yellow-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Learning Path
            </button>
          </div>
          <div className="border-t border-gray-200 mt-0" />
        </div>

        {/* Ranked Tab */}
        {activeTab === 'ranked' && (
          <div className="space-y-4">
            {ranked.map((resource, index) => (
              <div key={resource._id} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1 bg-yellow-400 text-black">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <ResourceCard
                    resource={resource}
                    projectId={projectId}
                    onSave={handleSave}
                  />
                  <div className="mt-2 mb-1">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Relevance score</span>
                      <span>{resource.relevanceScore.toFixed(1)}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-yellow-400 rounded-full h-1.5"
                        style={{ width: Math.min(resource.relevanceScore, 100) + '%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Learning Path Tab */}
        {activeTab === 'learningPath' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm font-medium">Recommended learning order</p>
              <p className="text-blue-600 text-xs mt-1">
                Resources are sequenced by type: start with documentation, then follow tutorials,
                then explore code examples, then watch videos, then read articles
              </p>
            </div>

            <div className="space-y-8">
              {Object.entries(grouped).map(([type, resources]) => (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-base font-semibold text-gray-700">
                      {TYPE_SECTION_LABELS[type]}
                    </h2>
                    <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-2 py-1">
                      {resources.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <ResourceCard
                        key={resource._id}
                        resource={resource}
                        projectId={projectId}
                        onSave={handleSave}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </>
  );
};

export default Recommendations;
