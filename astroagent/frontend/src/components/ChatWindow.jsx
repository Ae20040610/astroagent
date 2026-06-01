import { useEffect, useRef } from 'react'

function UserMessage({ content }) {
  return (
    <div className="flex justify-end mb-4 animate-slide-up">
      <div
        className="max-w-xs sm:max-w-md px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
        style={{
          background: 'linear-gradient(135deg, rgba(22,22,62,0.9) 0%, rgba(37,37,96,0.9) 100%)',
          border: '1px solid rgba(144,144,204,0.2)',
          color: '#e0e0ff',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {content}
      </div>
    </div>
  )
}

function AssistantMessage({ content, streaming }) {
  // Format the content with basic markdown-like styling
  const formatContent = (text) => {
    if (!text) return null
    const lines = text.split('\n')
    return lines.map((line, i) => {
      // Bold
      const formatted = line.replace(/\*\*(.*?)\*\*/g, (_, m) =>
        `<strong style="color:#fcd34d;font-weight:600">${m}</strong>`
      )
      return (
        <p
          key={i}
          dangerouslySetInnerHTML={{ __html: formatted }}
          style={{ margin: i === 0 ? 0 : '0.5em 0', lineHeight: 1.75 }}
        />
      )
    })
  }

  return (
    <div className="flex gap-3 mb-6 animate-slide-up">
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-base animate-float"
          style={{
            background: 'linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(96,60,170,0.2) 100%)',
            border: '1px solid rgba(212,160,23,0.3)',
          }}
        >
          ✦
        </div>
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-xs mb-2 font-medium" style={{ color: '#d4a017', letterSpacing: '0.08em' }}>
          ARADHANA
        </p>
        <div
          className="text-sm chat-prose"
          style={{ color: '#d0d0ee', fontFamily: "'DM Sans', sans-serif" }}
        >
          {content ? formatContent(content) : (
            <span className="animate-pulse" style={{ color: '#6060aa' }}>✦ ✦ ✦</span>
          )}
          {streaming && content && <span className="cursor-blink" />}
        </div>
      </div>
    </div>
  )
}

export default function ChatWindow({ messages }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'thin' }}>
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-60">
          <div className="text-5xl mb-4 animate-float">✦</div>
          <p className="font-serif text-lg mb-2" style={{ color: '#c0c0ee' }}>
            The stars are listening
          </p>
          <p className="text-sm" style={{ color: '#6060aa' }}>
            Share your birth details or ask anything about your cosmic blueprint
          </p>
        </div>
      )}

      {messages.map(msg => (
        msg.role === 'user'
          ? <UserMessage key={msg.id} content={msg.content} />
          : <AssistantMessage key={msg.id} content={msg.content} streaming={msg.streaming} />
      ))}

      <div ref={bottomRef} />
    </div>
  )
}
