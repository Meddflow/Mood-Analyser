import { useState } from 'react'

interface Props {
  onSubmit: (text: string, selectedScore: number | null) => void
  loading: boolean
  error: string | null
}

const MOODS = [
  { score: 1, emoji: '😔', label: 'Low' },
  { score: 2, emoji: '😕', label: 'Meh' },
  { score: 3, emoji: '😊', label: 'Okay' },
  { score: 4, emoji: '😄', label: 'Good' },
  { score: 5, emoji: '🤩', label: 'Great' },
]

export default function MoodCheckin({ onSubmit, loading, error }: Props) {
  const [text, setText] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) onSubmit(text.trim(), selected)
  }

  return (
    <div className="card checkin-card">
      <div className="checkin-header">
        <h1 className="app-title">How are you feeling today?</h1>
        <p className="app-subtitle">Tap a mood, then share what's on your mind.</p>
      </div>

      <div className="mood-scale">
        {MOODS.map(({ score, emoji, label }) => (
          <button
            key={score}
            type="button"
            className={`mood-tick ${selected === score ? 'mood-tick--active' : ''}`}
            onClick={() => setSelected(selected === score ? null : score)}
            disabled={loading}
            aria-pressed={selected === score}
          >
            <span className="mood-tick-emoji">{emoji}</span>
            <span className="mood-tick-label">{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="checkin-form">
        <textarea
          className="mood-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write freely… What's on your mind? What's weighing on you, or making you smile? This is your space."
          rows={6}
          disabled={loading}
          autoFocus
        />
        {error && <p className="error-text">{error}</p>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !text.trim()}
        >
          {loading ? (
            <span className="btn-loading">
              <span className="spinner" /> Analysing…
            </span>
          ) : (
            'Share & Reflect →'
          )}
        </button>
      </form>
    </div>
  )
}
