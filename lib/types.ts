export interface Profile {
  id: string
  role: 'admin' | 'user'
  display_name: string
  created_at: string
}

export interface PointAction {
  id: string
  title: string
  emoji: string
  points: number
  active: boolean
  created_at: string
}

export interface Reward {
  id: string
  title: string
  emoji: string
  points_required: number
  active: boolean
  created_at: string
}

export interface PointTransaction {
  id: string
  user_id: string
  action_id: string | null
  points: number
  note: string | null
  awarded_by: string | null
  created_at: string
  point_actions?: { title: string; emoji: string } | null
  profiles?: { display_name: string } | null
}

export interface Redemption {
  id: string
  user_id: string
  reward_id: string
  reward_title: string
  reward_emoji: string
  points_spent: number
  created_at: string
}

export interface RewardWish {
  id: string
  user_id: string
  title: string
  emoji: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_reply: string | null
  created_at: string
  profiles?: { display_name: string } | null
}

export interface PointRequest {
  id: string
  user_id: string
  title: string
  points_suggested: number | null
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_reply: string | null
  awarded_points: number | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  profiles?: { display_name: string } | null
}
