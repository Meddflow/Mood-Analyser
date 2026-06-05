export interface CheckinResponse {
  session_id: string
  mood_score: number
  text_score: number
  selected_score: number | null
  mood_label: string
  mood_emoji: string
  summary: string
  advice: string
}
