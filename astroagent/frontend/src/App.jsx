import { useEffect, useState } from 'react'
import StarField from './components/StarField'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import ChatInput from './components/ChatInput'
import ToolActivityPanel from './components/ToolActivityPanel'
import { useChat } from './hooks/useChat'

export default function App() {
  const {
    messages,
    isStreaming,
    activeTools,
    error,
    birthDetails,
    sendMessage,
    saveBirthDetails,
    clearChat,
    initSession,
  } = useChat()

  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    initSession()
  }, [])

  async function handleBirthDetailsSubmit(fields) {
    saveBirthDetails(fields)
    // Send as the first message to trigger chart computation
    const msg = `Please compute my birth chart. I was born on ${fields.date}${fields.time ? ' at ' + fields.time : ''} in ${fields.place}.`
    await sendMessage(msg, fields)
  }

  return (
    <div className="relative flex h-screen overflow-hidden" style={{ background: '#030309' }}>
      <StarField />

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="relative z-10 h-full flex-shrink-0">
          <Sidebar
            birthDetails={birthDetails}
            onBirthDetailsSubmit={handleBirthDetailsSubmit}
            onClearChat={clearChat}
            onQuickPrompt={(prompt) => sendMessage(prompt)}
          />
        </div>
      )}

      {/* Main chat area */}
      <div className="relative z-10 flex-1 flex flex-col h-full min-w-0">
        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{
            background: 'rgba(7,7,20,0.4)',
            borderBottom: '1px solid rgba(144,144,204,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all"
            style={{
              background: 'rgba(22,22,62,0.5)',
              border: '1px solid rgba(144,144,204,0.15)',
              color: '#9090cc',
              cursor: 'pointer',
            }}
          >
            ☰
          </button>
          <div>
            <h2 className="text-sm font-medium" style={{ color: '#c0c0ee' }}>
              {birthDetails ? `Reading for ${birthDetails.place || 'you'}` : 'Ask the Stars'}
            </h2>
          </div>
          {isStreaming && (
            <div className="ml-auto flex items-center gap-2 text-xs" style={{ color: '#d4a017' }}>
              <span className="animate-spin">✦</span>
              <span>Aradhana is reading…</span>
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mx-4 mt-3 px-4 py-3 rounded-xl text-sm flex items-start gap-3"
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
              color: '#fca5a5',
            }}
          >
            <span>⚠</span>
            <div>
              <p className="font-medium mb-0.5">Connection issue</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Chat messages */}
        <ChatWindow messages={messages} />

        {/* Tool activity */}
        <ToolActivityPanel activeTools={activeTools} />

        {/* Input */}
        <ChatInput
          onSend={(text) => sendMessage(text)}
          disabled={isStreaming}
          showSuggestions={messages.length === 0}
        />
      </div>
    </div>
  )
}
