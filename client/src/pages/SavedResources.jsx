import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import PageWrapper from '../components/layout/PageWrapper';
import ResourceCard from '../components/cards/ResourceCard';
import { getSavedResources, removeSaved, markComplete } from '../api/saved';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'tutorial', label: 'Tutorials' },
  { value: 'documentation', label: 'Docs' },
  { value: 'github', label: 'GitHub' },
  { value: 'video', label: 'Videos' },
  { value: 'article', label: 'Articles' },
];

const SavedResources = () => {
  const navigate = useNavigate();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    getSavedResources()
      .then((data) => {
        setSavedItems(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load saved resources');
        setLoading(false);
      });
  }, []);

  const handleRemove = async (savedId) => {
    try {
      await removeSaved(savedId);
      setSavedItems((prev) => prev.filter((item) => item._id !== savedId));
    } catch {
      // silent
    }
  };

  const handleComplete = async (savedId) => {
    try {
      const updated = await markComplete(savedId);
      setSavedItems((prev) =>
        prev.map((item) => (item._id === savedId ? updated : item))
      );
    } catch {
      // silent
    }
  };

  const filtered = savedItems.filter((item) => {
    if (filterType === 'all') return true;
    return item.resourceId?.resourceType === filterType;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-umbc-surface">
        <Sidebar />
        <PageWrapper>
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading saved resources...</p>
          </div>
        </PageWrapper>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-umbc-surface">
        <Sidebar />
        <PageWrapper>
          <div className="flex items-center justify-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        </PageWrapper>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-umbc-surface">
      <Sidebar />
      <PageWrapper>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Resources</h1>
            <p className="text-sm text-gray-500 mt-1">{savedItems.length} saved items</p>
          </div>
          <button
            onClick={() => navigate('/new-project')}
            className="bg-yellow-400 text-black font-semibold text-sm px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Explore Resources
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap items-center mb-6">
          <span className="text-sm text-gray-600 mr-2 self-center">Filter:</span>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                filterType === opt.value
                  ? 'bg-black text-yellow-400 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Empty state — no saved items at all */}
        {savedItems.length === 0 && (
          <div className="text-center mt-16 flex flex-col items-center">
            <span className="text-6xl">🔖</span>
            <p className="text-lg font-medium text-gray-600 mt-4">No saved resources yet</p>
            <p className="text-sm text-gray-400 mt-2 max-w-xs text-center">
              Save resources from your recommendations to access them here
            </p>
            <button
              onClick={() => navigate('/new-project')}
              className="bg-yellow-400 text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-500 mt-6 transition-colors"
            >
              Get Recommendations
            </button>
          </div>
        )}

        {/* Filtered empty state */}
        {savedItems.length > 0 && filtered.length === 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">No resources match this filter</p>
          </div>
        )}

        {/* Resource list */}
        {filtered.length > 0 && (
          <div className="space-y-6">
            {filtered.map((item) => (
              <div key={item._id}>
                <ResourceCard
                  resource={item.resourceId}
                  projectId={item.projectId}
                  onSave={() => {}}
                />
                <div className="flex justify-between items-center mt-2 px-1">
                  <div className="text-xs">
                    {item.isCompleted ? (
                      <span className="text-green-600 font-medium">
                        ✓ Completed on{' '}
                        {new Date(item.completedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        Saved on{' '}
                        {new Date(item.savedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!item.isCompleted && (
                      <button
                        onClick={() => handleComplete(item._id)}
                        className="border border-green-400 text-green-600 text-xs px-3 py-1 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(item._id)}
                      className="border border-red-300 text-red-400 text-xs px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageWrapper>
    </div>
  );
};

export default SavedResources;
