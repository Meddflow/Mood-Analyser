import type { CheckinResponse } from './types'

const BASE = import.meta.env.DEV ? 'http://localhost:8000' : ''

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? res.statusText)
  }
  return res.json()
}

export const submitCheckin = (text: string, selected_score: number | null) =>
  request<CheckinResponse>('/api/checkin', { text, selected_score })
