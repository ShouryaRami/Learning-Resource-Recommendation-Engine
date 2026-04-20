/**
 * ChatWidget component
 * Floating chat button and panel for AI-powered learning guidance.
 * Uses Gemini 2.5 Flash grounded in uploaded course materials (RAG).
 * Extracts courseId from the current URL so the right materials are used.
 * Shows source citations below AI responses when materials were found.
 */
import { useState, useEffect, useRef } from 'react'
import { sendMessage } from '../../api/chat'

/**
 * ChatWidget component
 * Floating chat button and panel for AI-powered learning guidance.
 * Uses Gemini 2.5 Flash grounded in uploaded course materials (RAG).
 * courseId must be passed as a prop — extracted from the URL by the parent.
 * @param {string|null} courseId  - Current course ID, or null if not on a course page
 * @param {string|null} projectId - Optional project ID for extra context
 */
const ChatWidget = ({ courseId = null, projectId = null }) => {
  const [isOpen, setIsOpen]     = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userText = input.trim()
    // Append user message immediately for responsive feel
    setMessages(prev => [...prev, { role: 'user', content: userText }])
    setInput('')
    setLoading(true)

    try {
      const data = await sendMessage(userText, courseId)
      // Store the full response data on the assistant message
      setMessages(prev => [...prev, {
        role:               'assistant',
        content:            data.reply,
        sources:            data.sources || [],
        hasMaterialContext: data.hasMaterialContext
      }])
    } catch {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col"
          style={{ position: 'fixed', bottom: '96px', right: '24px', zIndex: 50, width: '340px', height: '460px' }}
        >
          {/* Header */}
          <div className="bg-black rounded-t-xl px-4 py-3">
            <p className="text-yellow-400 font-semibold text-sm">AI Course Assistant</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {courseId
                ? 'Answers grounded in your course materials'
                : 'Navigate to a course page for material-grounded answers'}
            </p>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-6 px-4">
                <div className="text-3xl mb-2">👋</div>
                <div className="font-medium text-gray-600">Hi, I am your course assistant</div>
                <div className="text-xs mt-1 text-gray-400">
                  Ask me anything about your course or project.
                  I will answer using your uploaded course materials.
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end mb-1">
                    <div className="bg-yellow-400 text-black text-xs rounded-lg rounded-br-none px-3 py-2 max-w-xs break-words">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start mb-1">
                    <div className="max-w-xs">
                      <div className="bg-gray-100 text-gray-800 text-xs rounded-lg rounded-bl-none px-3 py-2 whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>

                      {/* Source citations — shown when materials provided context */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1 italic px-1">
                          Sources: {msg.sources.map(s => s.fileName).join(', ')}
                        </div>
                      )}

                      {/* Warning when no course materials were available */}
                      {msg.hasMaterialContext === false && (
                        <div className="text-xs text-yellow-600 mt-1 px-1">
                          No course materials uploaded yet — answer based on general knowledge
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 text-xs rounded-lg px-3 py-2 italic">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area — only shown when on a course page */}
          {courseId ? (
            <div className="border-t border-gray-200 p-3 flex gap-2">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Ask about your course or project..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend() }}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="bg-yellow-400 text-black rounded-lg px-3 py-2 text-xs font-semibold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-200 p-4 text-center text-gray-400 text-sm">
              <p>Open a course to use the AI assistant</p>
              <p className="text-xs mt-1 text-gray-400">
                The chat is grounded in your course materials
              </p>
            </div>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-14 h-14 rounded-full bg-yellow-400 text-black shadow-lg hover:bg-yellow-500 transition-all flex items-center justify-center text-2xl"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  )
}

export default ChatWidget
