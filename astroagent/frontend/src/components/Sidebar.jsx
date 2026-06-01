import { useState } from 'react'
import BirthDetailsForm from './BirthDetailsForm'

export default function Sidebar({ birthDetails, onBirthDetailsSubmit, onClearChat, onQuickPrompt }) {
  const [showForm, setShowForm] = useState(!birthDetails)

  async function handleSubmit(fields) {
    await onBirthDetailsSubmit(fields)
    setShowForm(false)
  }

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: 300,
        background: 'rgba(7,7,20,0.6)',
        borderRight: '1px solid rgba(144,144,204,0.1)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'rgba(144,144,204,0.1)' }}>
        <h1 className="font-serif text-2xl shimmer-text tracking-wide">✦ Aradhana</h1>
        <p className="text-xs mt-1" style={{ color: '#6060aa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Your Daily Spiritual Companion
        </p>
      </div>

      {/* Birth details */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {birthDetails && !showForm ? (
          <div>
            {/* Current chart summary */}
            <div
              className="rounded-xl p-4 mb-4"
              style={{
                background: 'rgba(22,22,62,0.5)',
                border: '1px solid rgba(212,160,23,0.15)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: '#d4a017', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Your Chart
                </span>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-xs"
                  style={{ color: '#6060aa', cursor: 'pointer', background: 'none', border: 'none' }}
                >
                  edit
                </button>
              </div>
              <div className="space-y-2 text-xs" style={{ color: '#9090cc' }}>
                {birthDetails.date && (
                  <div className="flex justify-between">
                    <span>Date</span>
                    <span style={{ color: '#c0c0ee' }}>{birthDetails.date}</span>
                  </div>
                )}
                {birthDetails.time && (
                  <div className="flex justify-between">
                    <span>Time</span>
                    <span style={{ color: '#c0c0ee' }}>{birthDetails.time}</span>
                  </div>
                )}
                {birthDetails.place && (
                  <div className="flex justify-between">
                    <span>Place</span>
                    <span style={{ color: '#c0c0ee' }} className="text-right ml-4 truncate max-w-[120px]">{birthDetails.place}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick prompts */}
            <div>
              <p className="text-xs mb-3 font-medium" style={{ color: '#6060aa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Explore
              </p>
              <div className="space-y-2">
                {[
                  { emoji: '🌟', label: 'My natal chart', prompt: 'Give me a full interpretation of my natal chart, including my Sun, Moon, and Rising signs and what they mean for my personality.' },
                  { emoji: '🌙', label: "Today's energy", prompt: "What are today's planetary transits and how do they affect my natal chart? What energy should I be aware of today?" },
                  { emoji: '💫', label: 'Love & relationships', prompt: 'Based on my natal chart, what does astrology say about my approach to love and relationships? What are my strengths and challenges in partnerships?' },
                  { emoji: '🏔️', label: 'Career & purpose', prompt: 'Based on my natal chart, what career paths and life purpose does astrology suggest for me? What are my natural talents and vocational strengths?' },
                ].map(({ emoji, label, prompt }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200"
                    style={{
                      background: 'rgba(22,22,62,0.3)',
                      border: '1px solid transparent',
                    }}
                    onClick={() => onQuickPrompt && onQuickPrompt(prompt)}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(212,160,23,0.2)'
                      e.currentTarget.style.background = 'rgba(22,22,62,0.6)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'transparent'
                      e.currentTarget.style.background = 'rgba(22,22,62,0.3)'
                    }}
                  >
                    <span>{emoji}</span>
                    <span className="text-sm" style={{ color: '#9090cc' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <BirthDetailsForm onSubmit={handleSubmit} existing={birthDetails} />
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: 'rgba(144,144,204,0.1)' }}>
        <button
          onClick={onClearChat}
          className="w-full py-2 rounded-lg text-xs transition-all duration-200"
          style={{
            background: 'transparent',
            border: '1px solid rgba(144,144,204,0.15)',
            color: '#6060aa',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(144,144,204,0.35)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(144,144,204,0.15)'}
        >
          ✦ New Reading
        </button>
      </div>
    </aside>
  )
}
