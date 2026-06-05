import { useState } from 'react'
import type { CheckinResponse } from './types'
import { submitCheckin } from './api'
import MoodCheckin from './components/MoodCheckin'
import MoodResult from './components/MoodResult'

type Phase = 'checkin' | 'result' | 'ended'

export default function App() {
  const [phase, setPhase] = useState<Phase>('checkin')
  const [result, setResult] = useState<CheckinResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckin = async (text: string, selectedScore: number | null) => {
    setLoading(true)
    setError(null)
    try {
      const data = await submitCheckin(text, selectedScore)
      setResult(data)
      setPhase('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setPhase('checkin')
    setResult(null)
    setError(null)
  }

  return (
    <div className="page">
      <div className="page-inner">
        {phase === 'checkin' && (
          <MoodCheckin onSubmit={handleCheckin} loading={loading} error={error} />
        )}

        {phase === 'result' && result && (
          <MoodResult result={result} onDone={() => setPhase('ended')} />
        )}

        {phase === 'ended' && result && (
          <div className="card ended-card">
            <span className="ended-emoji">{result.mood_emoji}</span>
            <h2 className="ended-title">Thanks for checking in 💙</h2>
            <p className="ended-sub">
              You showed up for yourself today — that matters.
            </p>
            <div className="ended-score">
              Today's mood: <strong>{result.mood_label}</strong>
            </div>
            <button className="btn btn-primary" onClick={handleReset}>
              New check-in
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
