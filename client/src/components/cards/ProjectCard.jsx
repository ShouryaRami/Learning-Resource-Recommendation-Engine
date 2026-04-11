/**
 * ProjectCard component
 * Displays a project summary with type badge, status indicator,
 * and contextual action buttons.
 * Used in the student dashboard and instructor project views.
 * @param {Object}   project     - Project document from the API
 * @param {Function} onDelete    - Called with projectId when delete/cancel clicked
 * @param {Function} onApprove   - Optional; called with projectId by staff views
 * @param {Function} onReject    - Optional; called with projectId by staff views
 * @param {boolean}  showActions - Whether to render the action button row
 */
import { useNavigate } from 'react-router-dom'

// Maps status enum values to display label and Tailwind colour classes
const statusConfig = {
  pitch_pending: { label: 'Pending Approval', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  active:        { label: 'Active',            bg: 'bg-green-100',  text: 'text-green-800'  },
  rejected:      { label: 'Rejected',          bg: 'bg-red-100',    text: 'text-red-800'    },
  completed:     { label: 'Completed',         bg: 'bg-blue-100',   text: 'text-blue-800'   },
  paused:        { label: 'Paused',            bg: 'bg-gray-100',   text: 'text-gray-600'   },
}

// Maps projectType to display label and colour classes
const typeConfig = {
  pitched:  { label: 'Pitched',  bg: 'bg-purple-100', text: 'text-purple-700' },
  assigned: { label: 'Assigned', bg: 'bg-blue-100',   text: 'text-blue-700'   },
}

const ProjectCard = ({
  project,
  onDelete,
  onApprove,
  onReject,
  showActions = true,
}) => {
  const navigate = useNavigate()

  const status = statusConfig[project.status] || statusConfig.paused
  const type   = typeConfig[project.projectType] || typeConfig.pitched

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">

      {/* Top row — title and status badge */}
      <div className="flex justify-between items-start gap-3">
        <h3 className="font-bold text-gray-900 truncate max-w-xs">
          {project.title}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Second row — type badge and course name */}
      <div className="mt-1 flex gap-2 items-center flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full ${type.bg} ${type.text}`}>
          {type.label}
        </span>
        {project.courseId && (
          <span className="text-xs text-gray-400">
            {project.courseId.title || project.courseId.code}
          </span>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-gray-500 mt-3 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Instructor feedback shown when rejected */}
      {project.status === 'rejected' && project.instructorFeedback && (
        <div className="bg-red-50 border border-red-100 rounded p-3 mt-3">
          <p className="text-xs text-red-600 font-medium">Instructor feedback:</p>
          <p className="text-xs text-red-500 mt-0.5">{project.instructorFeedback}</p>
        </div>
      )}

      {/* Bottom row — date on left, actions on right */}
      {showActions && (
        <div className="mt-4 flex gap-2 justify-between items-center">
          <span className="text-xs text-gray-400">
            {new Date(project.createdAt).toLocaleDateString()}
          </span>

          <div className="flex gap-2 flex-wrap">
            {/* Student: view recommendations for active projects */}
            {project.status === 'active' && (
              <button
                onClick={() => navigate(`/recommendations/${project._id}`)}
                className="bg-yellow-400 text-black text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-yellow-500"
              >
                View Recommendations
              </button>
            )}

            {/* Student: cancel a pending pitch */}
            {project.status === 'pitch_pending' && onDelete && (
              <button
                onClick={() => onDelete(project._id)}
                className="border border-red-200 text-red-500 text-xs px-3 py-1.5 rounded-lg hover:bg-red-50"
              >
                Cancel Pitch
              </button>
            )}

            {/* Staff: approve / reject pending pitches */}
            {project.status === 'pitch_pending' && onApprove && (
              <>
                <button
                  onClick={() => onApprove(project._id)}
                  className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => onReject(project._id)}
                  className="border border-red-300 text-red-500 text-xs px-3 py-1.5 rounded-lg hover:bg-red-50"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectCard
