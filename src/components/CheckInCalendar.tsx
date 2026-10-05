'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gift, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export function CheckInCalendar({ compact }: { compact?: boolean }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [checkedDays, setCheckedDays] = useState<Set<string>>(new Set())
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles')
        .select('points, last_checkin, checkin_streak').eq('id', user.id).single()
      if (p) {
        setProfile(p)
        const days = new Set<string>()
        if (p.last_checkin) {
          const lastDate = new Date(p.last_checkin)
          for (let i = 0; i < (p.checkin_streak || 0); i++) {
            const d = new Date(lastDate)
            d.setDate(d.getDate() - i)
            days.add(d.toISOString().split('T')[0])
          }
        }
        setCheckedDays(days)
      }
    }
    load()
  }, [])

  async function handleCheckIn() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (profile?.last_checkin === today) { toast('今日已签到 ✅'); setLoading(false); return }

    const streak = profile?.last_checkin === yesterday ? (profile.checkin_streak || 0) + 1 : 1
    let points = 1

    const { error } = await supabase.from('profiles').update({
      points: (profile?.points || 0) + points,
      last_checkin: today,
      checkin_streak: streak === 7 ? 0 : streak,
    }).eq('id', user.id)

    if (error) { toast.error('签到失败'); setLoading(false); return }

    setProfile((prev: any) => ({ ...prev, points: (prev?.points || 0) + points, last_checkin: today, checkin_streak: streak === 7 ? 0 : streak }))
    setCheckedDays(prev => new Set(prev).add(today))
    toast.success(streak === 7 ? `🎉 连续7天！+${points}` : `+${points} 积分 (第${streak}天)`)
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]
  const canCheckIn = profile?.last_checkin !== today
  const streak = profile?.last_checkin === today ? (profile?.checkin_streak || 0) + 1 : (profile?.checkin_streak || 0)

  // Calendar data
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  function prevMonth() { setCurrentMonth(new Date(year, month - 1, 1)) }
  function nextMonth() {
    const next = new Date(year, month + 1, 1)
    if (next <= new Date()) setCurrentMonth(next)
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className={compact ? 'bg-white p-3' : 'bg-white rounded-xl p-4'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Gift className="w-3.5 h-3.5" style={{ color: '#D97706' }} />
          <span className="text-xs font-semibold text-gray-800">签到</span>
          {streak > 1 && <span className="text-[10px] font-medium" style={{ color: '#D97706' }}>连{streak}天</span>}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={prevMonth} className="p-0.5 hover:bg-gray-100 rounded"><ChevronLeft className="w-3 h-3 text-gray-400"/></button>
          <span className="text-[10px] text-gray-500 w-14 text-center">{month+1}月</span>
          <button onClick={nextMonth} className="p-0.5 hover:bg-gray-100 rounded"><ChevronRight className="w-3 h-3 text-gray-400"/></button>
        </div>
      </div>

      {/* Weekday */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map(d => <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>)}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const isChecked = checkedDays.has(dateStr)
          const isToday = dateStr === today
          const isFuture = dateStr > today
          return (
            <div key={day}
              className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                isChecked ? 'bg-blue-50 text-debate-for' :
                isToday ? 'bg-debate-for text-white' :
                isFuture ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {isChecked ? <Check className="w-3 h-3" /> : day}
            </div>
          )
        })}
      </div>

      {/* Check-in button + streak */}
      <div className="flex items-center gap-2 mt-2">
        <button onClick={handleCheckIn} disabled={loading || !canCheckIn}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
            canCheckIn ? 'bg-debate-for text-white hover:opacity-90 shadow-sm' : 'bg-gray-100 text-gray-500'
          }`}>
          {canCheckIn ? '签到 +1' : '✅ 已签到'}
        </button>
        <div className="flex items-center gap-px flex-1">
          {[1,2,3,4,5,6,7].map(d => {
            const filled = (streak || 0) >= d
            return (
              <div key={d}
                className={`flex-1 h-1.5 rounded-full ${filled ? (d===7?'bg-debate-for':'bg-debate-for/30') : 'bg-gray-100'}`} />
            )
          })}
        </div>
        <span className="text-[10px] text-gray-400 shrink-0">7天</span>
      </div>
    </div>
  )
}
