import { useState } from 'react';
import { saveResource } from '../../api/saved';
import { submitFeedback } from '../../api/feedback';
import StarRating from '../StarRating';

const TYPE_LABELS = {
  documentation: '📄 Docs',
  tutorial: '🎓 Tutorial',
  github: '💻 GitHub',
  video: '🎬 Video',
  article: '📝 Article',
  book: '📚 Book',
  library: '🗂 Library',
};

const LEVEL_COLORS = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

const ResourceCard = ({ resource, projectId, onSave }) => {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleSave = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      await saveResource(resource._id, projectId);
      setSaved(true);
      if (onSave) onSave(resource._id);
    } catch {
      // silently fail — button returns to default state
    } finally {
      setSaving(false);
    }
  };

  const handleRate = async (stars) => {
    setUserRating(stars);
    try {
      await submitFeedback(resource._id, stars, '', null);
      setRatingSubmitted(true);
    } catch {
      // silent
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {resource.resourceType && (
              <span className="text-xs font-medium text-gray-500">
                {TYPE_LABELS[resource.resourceType] || resource.resourceType}
              </span>
            )}
            {resource.skillLevel && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[resource.skillLevel] || 'bg-gray-100 text-gray-600'}`}>
                {resource.skillLevel.charAt(0).toUpperCase() + resource.skillLevel.slice(1)}
              </span>
            )}
            {resource.estimatedHours && (
              <span className="text-xs text-gray-400">
                ~{resource.estimatedHours}h
              </span>
            )}
          </div>

          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-umbc-black hover:text-yellow-600 leading-snug block mb-1"
          >
            {resource.title}
          </a>

          {resource.description && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
              {resource.description}
            </p>
          )}

          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resource.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Star rating row */}
          <div className="flex items-center gap-2 mt-2 min-h-6">
            {ratingSubmitted ? (
              <span className="text-xs text-green-600 font-medium">✓ Thanks for rating!</span>
            ) : (
              <>
                <span className="text-xs text-gray-400">Rate:</span>
                <StarRating rating={userRating} onRate={handleRate} readonly={false} />
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={saved || saving}
            className={`text-xs px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              saved
                ? 'bg-green-100 text-green-700 cursor-default'
                : saving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-yellow-400 hover:bg-yellow-500 text-black'
            }`}
          >
            {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save'}
          </button>

          {resource.youtubeUrl && resource.youtubeUrl.trim() !== '' && (
            <a
              href={resource.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded font-medium bg-red-100 text-red-600 hover:bg-red-200 transition-colors text-center whitespace-nowrap"
            >
              ▶ Watch
            </a>
          )}
        </div>
      </div>

      {resource.averageRating > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1">
          <span className="text-yellow-400 text-xs">★</span>
          <span className="text-xs text-gray-500">
            {resource.averageRating.toFixed(1)} ({resource.totalRatings} rating{resource.totalRatings !== 1 ? 's' : ''})
          </span>
        </div>
      )}
    </div>
  );
};

export default ResourceCard;
