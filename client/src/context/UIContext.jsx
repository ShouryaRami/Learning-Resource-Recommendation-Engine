/**
 * UIContext — Global UI state (sidebar open/close)
 * Extracted from App.jsx so toggling the sidebar does not
 * remount page components. Only Sidebar and PageWrapper
 * subscribe to this context and re-render on changes.
 */
import { createContext, useContext, useState, useEffect } from 'react'

const UIContext = createContext(null)

export const UIProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024)
  const toggleSidebar = () => setSidebarOpen(prev => !prev)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <UIContext.Provider value={{ sidebarOpen, toggleSidebar }}>
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => useContext(UIContext)
