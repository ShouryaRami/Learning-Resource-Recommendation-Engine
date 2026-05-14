/**
 * @desc Global toast notification component
 * Fixed position top-right so always visible.
 * Auto-dismisses after 3 seconds via UIContext.
 */
import { useEffect } from 'react'

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  const colors = {
    success: 'bg-green-500 text-white',
    error:   'bg-red-500 text-white',
    info:    'bg-blue-500 text-white',
    warning: 'bg-yellow-400 text-black'
  }

  const icons = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ'
  }

  return (
    <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg
      flex items-center gap-3 text-sm font-medium transition-all duration-300
      ${colors[type] || colors.success}`}
    >
      <span>{icons[type] || icons.info}</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}

export default Toast
