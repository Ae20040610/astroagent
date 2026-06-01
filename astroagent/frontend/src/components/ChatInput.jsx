import { useState } from 'react'

const SUGGESTIONS = [
  "What does my chart say about my career?",
  "What's the energy like for me today?",
  "Explain my Venus placement",
  "When is my Saturn return?",
]

export default function ChatInput({ onSend, disabled, showSuggestions }) {
  const [value, setValue] = useState('')

  function handleSend() {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="px-4 pb-4 pt-2">
      {/* Suggestions */}
      {showSuggestions && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => { setValue(s); }}
              className="text-xs px-3 py-1.5 rounded-full transition-all duration-200"
              style={{
                background: 'rgba(22,22,62,0.8)',
                border: '1px solid rgba(144,144,204,0.2)',
                color: '#9090cc',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(212,160,23,0.4)'
                e.currentTarget.style.color = '#fcd34d'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(144,144,204,0.2)'
                e.currentTarget.style.color = '#9090cc'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        className="flex gap-3 items-end rounded-2xl p-3"
        style={{
          background: 'rgba(14,14,40,0.8)',
          border: '1px solid rgba(144,144,204,0.2)',
          transition: 'border-color 0.2s',
        }}
        onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(212,160,23,0.35)'}
        onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(144,144,204,0.2)'}
      >
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask Aradhana anything about your chart…"
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-sm outline-none"
          style={{
            color: '#e0e0ff',
            fontFamily: "'DM Sans', sans-serif",
            maxHeight: 120,
            lineHeight: 1.6,
          }}
        />

        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all duration-200"
          style={{
            background: (!value.trim() || disabled)
              ? 'rgba(96,96,170,0.15)'
              : 'linear-gradient(135deg, rgba(212,160,23,0.85) 0%, rgba(244,185,66,0.85) 100%)',
            color: (!value.trim() || disabled) ? '#6060aa' : '#070714',
            cursor: (!value.trim() || disabled) ? 'not-allowed' : 'pointer',
            border: 'none',
          }}
        >
          {disabled ? <span className="animate-spin text-sm">✦</span> : '↑'}
        </button>
      </div>

      <p className="text-center text-xs mt-2" style={{ color: '#3c3c7a' }}>
        Aradhana offers cosmic perspective, not medical, legal, or financial advice.
      </p>
    </div>
  )
}
