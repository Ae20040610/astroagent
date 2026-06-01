import { useEffect, useState } from 'react'

const TOOL_ICONS = {
  geocode_place: '🌍',
  compute_birth_chart: '⭐',
  get_daily_transits: '🔭',
  knowledge_lookup: '📖',
}

const TOOL_LABELS = {
  geocode_place: 'Locating birthplace',
  compute_birth_chart: 'Computing natal chart',
  get_daily_transits: 'Reading today\'s transits',
  knowledge_lookup: 'Consulting the stars',
}

function ToolPill({ tool, status }) {
  const icon = TOOL_ICONS[tool.name] || '✦'
  const label = TOOL_LABELS[tool.name] || tool.name
  const isDone = status === 'done'

  return (
    <div
      className="tool-pill"
      style={{
        opacity: isDone ? 0.5 : 1,
        borderColor: isDone ? 'rgba(144,144,204,0.15)' : 'rgba(212,160,23,0.3)',
        background: isDone ? 'rgba(144,144,204,0.05)' : 'rgba(212,160,23,0.08)',
        transition: 'all 0.4s ease',
      }}
    >
      <span>{isDone ? '✓' : <span className="animate-spin inline-block">{icon}</span>}</span>
      <span>{label}</span>
    </div>
  )
}

export default function ToolActivityPanel({ activeTools }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (activeTools.length > 0) setVisible(true)
    else {
      const t = setTimeout(() => setVisible(false), 1500)
      return () => clearTimeout(t)
    }
  }, [activeTools])

  if (!visible && activeTools.length === 0) return null

  return (
    <div
      className="flex flex-wrap gap-2 px-4 py-2"
      style={{
        animation: 'slideUp 0.3s ease-out',
        opacity: activeTools.length === 0 ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      <span className="text-xs" style={{ color: '#6060aa', fontFamily: 'JetBrains Mono, monospace', alignSelf: 'center' }}>
        using:
      </span>
      {activeTools.map((tool, i) => (
        <ToolPill key={i} tool={tool} status={tool.status} />
      ))}
    </div>
  )
}
