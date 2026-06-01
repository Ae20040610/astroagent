import { useState } from 'react'

const ZODIAC_SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']

function validate(fields) {
  const errs = {}
  if (!fields.date) errs.date = 'Birth date is required'
  if (!fields.place || fields.place.trim().length < 2) errs.place = 'Please enter a city or place'
  // time is optional but if provided must be valid
  if (fields.time && !/^\d{2}:\d{2}$/.test(fields.time)) errs.time = 'Use HH:MM format'
  return errs
}

export default function BirthDetailsForm({ onSubmit, existing }) {
  const [fields, setFields] = useState({
    date: existing?.date || '',
    time: existing?.time || '',
    place: existing?.place || '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setFields(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(errs => ({ ...errs, [e.target.name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await onSubmit(fields)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Decorative header */}
      <div className="text-center mb-6">
        <div className="flex justify-center gap-2 text-xl text-yellow-300 mb-3 animate-pulse-slow">
          {ZODIAC_SYMBOLS.slice(0, 6).map((s, i) => (
            <span key={i} style={{ opacity: 0.4 + i * 0.1 }}>{s}</span>
          ))}
        </div>
        <h2 className="font-serif text-2xl text-yellow-200 mb-1">Your Birth Chart</h2>
        <p className="text-sm text-night-300" style={{ color: '#9090cc' }}>
          Share your birth details to unlock your cosmic blueprint
        </p>
        <div className="flex justify-center gap-2 text-xl text-yellow-300 mt-3 animate-pulse-slow">
          {ZODIAC_SYMBOLS.slice(6).map((s, i) => (
            <span key={i} style={{ opacity: 0.7 - i * 0.08 }}>{s}</span>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#c0c0ee', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Date of Birth
          </label>
          <input
            type="date"
            name="date"
            value={fields.date}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(14,14,40,0.8)',
              border: `1px solid ${errors.date ? '#f87171' : 'rgba(144,144,204,0.25)'}`,
              color: '#e0e0ff',
              fontFamily: "'DM Sans', sans-serif",
            }}
            onFocus={e => e.target.style.borderColor = '#f4b942'}
            onBlur={e => e.target.style.borderColor = errors.date ? '#f87171' : 'rgba(144,144,204,0.25)'}
          />
          {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
        </div>

        {/* Time */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#c0c0ee', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Time of Birth <span style={{ color: '#6060aa', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="time"
            name="time"
            value={fields.time}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(14,14,40,0.8)',
              border: `1px solid ${errors.time ? '#f87171' : 'rgba(144,144,204,0.25)'}`,
              color: '#e0e0ff',
              fontFamily: "'DM Sans', sans-serif",
            }}
            onFocus={e => e.target.style.borderColor = '#f4b942'}
            onBlur={e => e.target.style.borderColor = errors.time ? '#f87171' : 'rgba(144,144,204,0.25)'}
          />
          {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time}</p>}
          <p className="text-xs mt-1" style={{ color: '#6060aa' }}>
            Without birth time, house cusps and rising sign cannot be computed accurately.
          </p>
        </div>

        {/* Place */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#c0c0ee', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Place of Birth
          </label>
          <input
            type="text"
            name="place"
            value={fields.place}
            onChange={handleChange}
            placeholder="e.g. Mumbai, India"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(14,14,40,0.8)',
              border: `1px solid ${errors.place ? '#f87171' : 'rgba(144,144,204,0.25)'}`,
              color: '#e0e0ff',
              fontFamily: "'DM Sans', sans-serif",
            }}
            onFocus={e => e.target.style.borderColor = '#f4b942'}
            onBlur={e => e.target.style.borderColor = errors.place ? '#f87171' : 'rgba(144,144,204,0.25)'}
          />
          {errors.place && <p className="text-red-400 text-xs mt-1">{errors.place}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-medium text-sm transition-all duration-200 relative overflow-hidden"
          style={{
            background: loading
              ? 'rgba(212,160,23,0.3)'
              : 'linear-gradient(135deg, rgba(212,160,23,0.9) 0%, rgba(244,185,66,0.9) 100%)',
            color: loading ? '#9090cc' : '#070714',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">✦</span> Computing your chart…
            </span>
          ) : (
            '✦ Reveal My Chart'
          )}
        </button>
      </form>
    </div>
  )
}
