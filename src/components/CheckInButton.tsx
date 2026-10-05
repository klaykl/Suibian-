'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gift } from 'lucide-react'
import toast from 'react-hot-toast'

export function CheckInButton() {
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  async function handleCheckIn() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('请先登录'); setLoading(false); return }

    const { data: profile } = await supabase.from('profiles')
      .select('points, last_checkin, checkin_streak').eq('id', user.id).single()

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (profile?.last_checkin === today) {
      toast('今日已签到 ✅')
      setChecked(true)
      setLoading(false)
      return
    }

    const streak = profile?.last_checkin === yesterday ? (profile.checkin_streak || 0) + 1 : 1
    let points = 5
    if (streak === 7) points += 10

    const { error } = await supabase.from('profiles').update({
      points: (profile?.points || 0) + points,
      last_checkin: today,
      checkin_streak: streak === 7 ? 0 : streak,
    }).eq('id', user.id)

    if (error) { toast.error('签到失败'); setLoading(false); return }

    setChecked(true)
    const msg = streak === 7 ? `🎉 连续7天！+${points} 积分` : `签到成功 +${points} 积分 (连续${streak}天)`
    toast.success(msg)
    setLoading(false)
  }

  return (
    <button
      onClick={handleCheckIn}
      disabled={loading || checked}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
        checked
          ? 'bg-green-50 text-green-600 border border-green-200'
          : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 shadow-md'
      } disabled:opacity-80`}
    >
      <Gift className="w-4 h-4" />
      {checked ? '今日已签到' : '每日签到 +5'}
    </button>
  )
}
