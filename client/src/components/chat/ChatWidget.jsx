import { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../../api/chat';

/**
 * ChatWidget component
 * Floating chat button and panel for AI-powered
 * learning guidance. Renders a toggle button
 * fixed to the bottom right of the screen.
 * Chat panel opens on click with message history.
 * Note: Full LLM integration planned for Beta.
 * Currently uses keyword-based responses.
 */
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const allMessages = [...messages, userMessage];
      const reply = await sendMessage(allMessages, null);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}>
      {/* Chat panel */}
      {isOpen && (
        <div
          className="bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col"
          style={{ position: 'fixed', bottom: '96px', right: '24px', zIndex: 50, width: '320px', height: '420px' }}
        >
          {/* Header */}
          <div className="bg-black rounded-t-xl px-4 py-3">
            <p className="text-yellow-400 font-semibold text-sm">AI Assistant</p>
            <p className="text-gray-400 text-xs mt-0.5">Basic guidance — Full AI in Beta</p>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-6 px-4">
                <div className="text-3xl mb-2">👋</div>
                <div className="font-medium text-gray-600">Hi I am your learning assistant</div>
                <div className="text-xs mt-1 text-gray-400">
                  Full AI guidance coming in Beta. For now I can help with basic software engineering questions.
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
                    <div className="bg-gray-100 text-gray-800 text-xs rounded-lg rounded-bl-none px-3 py-2 max-w-xs whitespace-pre-wrap break-words">
                      {msg.content}
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

          {/* Input area */}
          <div className="border-t border-gray-200 p-3 flex gap-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) handleSend();
              }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-yellow-400 text-black rounded-lg px-3 py-2 text-xs font-semibold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full bg-yellow-400 text-black shadow-lg hover:bg-yellow-500 transition-all flex items-center justify-center text-2xl"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
};

export default ChatWidget;
