import type { CheckinResponse } from '../types'

interface Props {
  result: CheckinResponse
  onDone: () => void
}

const SCORE_COLORS: Record<number, string> = {
  1: '#e07070',
  2: '#e0a070',
  3: '#70a0e0',
  4: '#70c070',
  5: '#a070e0',
}

const MOOD_EMOJIS: Record<number, string> = {
  1: '😔', 2: '😕', 3: '😊', 4: '😄', 5: '🤩',
}

export default function MoodResult({ result, onDone }: Props) {
  const color = SCORE_COLORS[result.mood_score] ?? '#6c63ff'
  const blended = result.selected_score !== null

  return (
    <div className="card result-card">
      <div className="result-emoji-wrap" style={{ '--mood-color': color } as React.CSSProperties}>
        <span className="result-emoji">{result.mood_emoji}</span>
      </div>

      <div className="result-badge" style={{ background: color }}>
        {result.mood_score}/5 · {result.mood_label}
      </div>

      {blended && (
        <div className="score-breakdown">
          <div className="score-row">
            <span className="score-row-label">Text analysis</span>
            <span className="score-row-pip">
              {MOOD_EMOJIS[result.text_score]} {result.text_score}/5
            </span>
          </div>
          <div className="score-row">
            <span className="score-row-label">Self-rated</span>
            <span className="score-row-pip">
              {MOOD_EMOJIS[result.selected_score!]} {result.selected_score}/5
            </span>
          </div>
          <div className="score-divider" />
          <div className="score-row score-row--final">
            <span className="score-row-label">Final score <span className="score-formula">(60% text · 40% self)</span></span>
            <span className="score-row-pip">
              {result.mood_emoji} {result.mood_score}/5
            </span>
          </div>
        </div>
      )}

      <div className="analysis-box">
        <p className="analysis-label">What we noticed</p>
        <p className="analysis-text">{result.summary}</p>
      </div>

      <div className="advice-box">
        <p className="advice-label">A word for you</p>
        <p className="advice-text">{result.advice}</p>
      </div>

      <button className="btn btn-primary" onClick={onDone}>
        Done for today
      </button>
    </div>
  )
}
