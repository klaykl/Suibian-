import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import Link from 'next/link'
import { Gift, Trophy, TrendingUp, ChevronRight, Flame } from 'lucide-react'

export async function Sidebar() {
  const supabase = await createClient()
  const user = await getUser()

  let checkinInfo = { streak: 0, checked: false }
  if (user) {
    const { data: p } = await supabase.from('profiles').select('last_checkin, checkin_streak').eq('id', user.id).single()
    const today = new Date().toISOString().split('T')[0]
    const streak = p?.last_checkin === today ? (p?.checkin_streak || 0) + 1 : (p?.checkin_streak || 0)
    checkinInfo = { streak, checked: p?.last_checkin === today }
  }

  const now = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
  const { data: topDebaters } = await supabase.rpc('get_period_rankings', {
    period_start: weekStart.toISOString(), period_end: now.toISOString(), limit_count: 5,
  })

  const { data: allTopics } = await supabase.rpc('get_topics_with_counts')

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold" style={{ color: '#111827' }}>社区中心</span>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="text-xs font-semibold" style={{ color: '#111827' }}>
              {checkinInfo.checked ? `连续签到 ${checkinInfo.streak} 天` : '每日签到'}
            </span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: checkinInfo.checked ? '#F3F4F6' : '#FEF3C7', color: checkinInfo.checked ? '#9CA3AF' : '#D97706' }}>
            {checkinInfo.checked ? '已签' : '+1'}
          </span>
        </div>
      </div>

      {topDebaters && topDebaters.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy className="w-3.5 h-3.5" style={{ color: '#D97706' }} />
            <span className="text-xs font-medium" style={{ color: '#4B5563' }}>本周最具说服力</span>
          </div>
          <div className="space-y-1.5">
            {(topDebaters as any[]).slice(0, 3).map((d: any, i: number) => (
              <Link key={d.user_id} href={`/users/${d.user_id}`}
                className={`flex items-center gap-2 rounded-md px-1.5 py-1.5 -mx-1.5 transition-colors ${i === 0 ? 'bg-brand-light/50' : 'hover:bg-gray-50'}`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: i === 0 ? '#F59E0B' : '#4B5563' }}>{(d.username||'?')[0]}</span>
                <span className="text-xs flex-1 truncate font-medium" style={{ color: i === 0 ? '#1E3A8A' : '#374151' }}>{d.username}</span>
                <span className="text-[10px] font-semibold" style={{ color: i === 0 ? '#F59E0B' : '#9CA3AF' }}>{d.score} 赞</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {allTopics && (() => {
        const hotToday = (allTopics || []).filter((t: any) => t.status === 'active')
          .sort((a: any, b: any) => (b.for_count + b.against_count) - (a.for_count + a.against_count))
          .slice(0, 5)
        if (hotToday.length === 0) return null
        return (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Flame className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
              <span className="text-xs font-medium" style={{ color: '#4B5563' }}>今日热点</span>
            </div>
            <div className="space-y-1">
              {hotToday.map((t: any) => (
                <Link key={t.id} href={`/topics/${t.id}`}
                  className="block text-xs py-1 px-1.5 -mx-1.5 rounded hover:bg-gray-50 transition-colors"
                  style={{ color: '#374151' }}>
                  <span className="line-clamp-1">{t.title}</span>
                  <span className="text-[10px] ml-1" style={{ color: '#9CA3AF' }}>{t.for_count + t.against_count} 人</span>
                </Link>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: '#1E3A8A' }} />
          <span className="text-xs font-medium" style={{ color: '#4B5563' }}>热门标签</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['科技','职场','生活','哲学','教育','AI'].map(cat => (
            <Link key={cat} href={`/?cat=${cat}`}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors hover:bg-brand-light hover:text-brand"
              style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
              {cat}
            </Link>
          ))}
        </div>
      </div>

      <Link href="/rankings" className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
        <span className="text-xs" style={{ color: '#6B7280' }}>查看完整排行榜</span>
        <ChevronRight className="w-3 h-3" style={{ color: '#6B7280' }} />
      </Link>
    </div>
  )
}
