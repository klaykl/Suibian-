import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles')
    .select('points, last_checkin, checkin_streak').eq('id', user.id).single()

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (profile?.last_checkin === today) {
    return NextResponse.json({ error: '今日已签到', points: profile.points })
  }

  const streak = profile?.last_checkin === yesterday ? (profile.checkin_streak || 0) + 1 : 1
  let points = 5
  if (streak === 7) points += 10 // 7-day streak bonus

  const { data: updated } = await supabase.from('profiles').update({
    points: (profile?.points || 0) + points,
    last_checkin: today,
    checkin_streak: streak === 7 ? 0 : streak,
  }).eq('id', user.id).select('points, checkin_streak').single()

  return NextResponse.json({
    success: true,
    added: points,
    total: updated?.points,
    streak: updated?.checkin_streak || streak,
    message: streak === 7 ? `🎉 连续7天！获得 ${points} 积分` : `签到成功 +${points} 积分`,
  })
}
