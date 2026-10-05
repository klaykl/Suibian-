export type TopicStatus = 'active' | 'closed'

export type Side = 'for' | 'against'

export interface Topic {
  id: string
  title: string
  description: string | null
  status: TopicStatus
  starts_at: string
  ends_at: string
  final_for_count: number
  final_against_count: number
  created_by: string
  created_at: string
}

export interface TopicWithCounts extends Topic {
  for_count: number
  against_count: number
  total_participants: number
  switch_for_to_against: number
  switch_against_to_for: number
}

export interface Affiliation {
  id: string
  user_id: string
  topic_id: string
  side: Side
  changed_at: string | null
  created_at: string
}

export interface AffiliationChange {
  id: string
  affiliation_id: string
  user_id: string
  topic_id: string
  from_side: Side
  to_side: Side
  changed_at: string
}

export interface Comment {
  id: string
  topic_id: string
  user_id: string
  parent_id: string | null
  body: string
  side_at_time: Side
  upvote_count: number
  created_at: string
  // joined
  username?: string
  avatar_url?: string | null
  has_switched?: boolean
}

export interface Upvote {
  id: string
  user_id: string
  comment_id: string
}

export interface UserProfile {
  id: string
  username: string
  email: string
  avatar_url: string | null
}
