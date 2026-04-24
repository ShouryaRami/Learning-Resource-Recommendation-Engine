/**
 * SkeletonCard component
 * Animated loading placeholder that mimics a content card.
 * Use on pages that load lists of resources or courses.
 * @param {number} count - How many skeleton cards to show
 * @param {string} className - Optional extra classes
 */
function SkeletonCard({ count = 3, className = '' }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={'bg-white rounded-xl border border-gray-200 p-5 ' + className}>
          <div className="animate-pulse space-y-3">
            <div className="flex justify-between items-start">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-5 bg-gray-200 rounded-full w-16"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-2 pt-1">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="flex gap-2 pt-1">
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default SkeletonCard
