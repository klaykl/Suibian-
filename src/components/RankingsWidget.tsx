import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Trophy, Crown } from 'lucide-react'

async function getTop3(period: 'week' | 'month') {
  const supabase = await createClient()
  const now = new Date()
  const dayOfWeek = now.getDay()
  const lastMonday = new Date(now); lastMonday.setDate(now.getDate() - dayOfWeek - 6)
  const lastSunday = new Date(now); lastSunday.setDate(now.getDate() - dayOfWeek)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const start = period === 'week' ? lastMonday : lastMonthStart
  const end = period === 'week' ? lastSunday : lastMonthEnd
  const { data } = await supabase.rpc('get_period_rankings', {
    period_start: start.toISOString(), period_end: end.toISOString(), limit_count: 3,
  })
  return data || []
}

export async function RankingsWidget() {
  const [weekTop, monthTop] = await Promise.all([getTop3('week'), getTop3('month')])

  return (
    <div className="space-y-3">
      {/* 上周最佳 */}
      <Link href="/rankings?period=week" className="block p-4 hover:bg-gray-50/50 rounded-lg transition-all">
        <div className="flex items-center gap-1.5 mb-3">
          <Trophy className="w-4 h-4" style={{ color: '#1E56FF' }} />
          <span className="text-sm font-semibold" style={{ color: '#18181B' }}>上周最佳</span>
        </div>
        {weekTop.length === 0 ? (
          <p className="text-xs" style={{ color: '#71717A' }}>暂无数据</p>
        ) : (
          <div className="space-y-2">
            {weekTop.map((u: any, i: number) => (
              <div key={u.user_id} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32', color: i === 0 ? '#18181B' : '#fff' }}>{i + 1}</span>
                <span className="text-sm truncate" style={{ color: '#18181B' }}>{u.username || '匿名'}</span>
                <span className="text-xs font-medium ml-auto tabular-nums" style={{ color: '#1E56FF' }}>{u.score} 👍</span>
              </div>
            ))}
          </div>
        )}
      </Link>

      {/* 上月最佳 */}
      <Link href="/rankings?period=month" className="block p-4 hover:bg-gray-50/50 rounded-lg transition-all">
        <div className="flex items-center gap-1.5 mb-3">
          <Crown className="w-4 h-4" style={{ color: '#1E56FF' }} />
          <span className="text-sm font-semibold" style={{ color: '#18181B' }}>上月最佳</span>
        </div>
        {monthTop.length === 0 ? (
          <p className="text-xs" style={{ color: '#71717A' }}>暂无数据</p>
        ) : (
          <div className="space-y-2">
            {monthTop.map((u: any, i: number) => (
              <div key={u.user_id} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32', color: i === 0 ? '#18181B' : '#fff' }}>{i + 1}</span>
                <span className="text-sm truncate" style={{ color: '#18181B' }}>{u.username || '匿名'}</span>
                <span className="text-xs font-medium ml-auto tabular-nums" style={{ color: '#1E56FF' }}>{u.score} 👍</span>
              </div>
            ))}
          </div>
        )}
      </Link>
    </div>
  )
}
