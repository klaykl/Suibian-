import { createClient } from '@/lib/supabase/server'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export async function TopicTrend({ topicId }: { topicId: string }) {
  const supabase = await createClient()

  // Get current counts
  const { count: forCount } = await supabase.from('affiliations').select('*', { count: 'exact', head: true }).eq('topic_id', topicId).eq('side', 'for')
  const { count: againstCount } = await supabase.from('affiliations').select('*', { count: 'exact', head: true }).eq('topic_id', topicId).eq('side', 'against')
  const total = (forCount || 0) + (againstCount || 0)
  const forPct = total > 0 ? Math.round((forCount || 0) / total * 100) : 50

  // Get yesterday's snapshot
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]
  const { data: snapshot } = await supabase.from('position_snapshots').select('*').eq('topic_id', topicId).eq('snapshot_date', dateStr).maybeSingle()

  // Save today's snapshot
  const today = new Date().toISOString().split('T')[0]
  const { data: todaySnapshot } = await supabase.from('position_snapshots').select('id').eq('topic_id', topicId).eq('snapshot_date', today).maybeSingle()
  if (!todaySnapshot) {
    await supabase.from('position_snapshots').upsert({
      topic_id: topicId, for_count: forCount || 0, against_count: againstCount || 0,
      total_participants: total, snapshot_date: today,
    }, { onConflict: 'topic_id,snapshot_date' })
  }

  if (!snapshot) return null

  const yesterdayForPct = snapshot.total_participants > 0 ? Math.round(snapshot.for_count / snapshot.total_participants * 100) : 50
  const change = forPct - yesterdayForPct
  const isUp = change > 0
  const isDown = change < 0

  return (
    <div className="bg-white border-t-2 pt-4" style={{ borderTopColor: '#2563EB' }}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4" style={{ color: '#2563EB' }} />
        <span className="text-sm font-bold" style={{ color: '#0F172A' }}>立场趋势</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: '#6B7280' }}>昨天</span>
              <span className="text-sm font-bold" style={{ color: '#1E3A8A' }}>{yesterdayForPct}%</span>
              <span className="text-[10px]" style={{ color: '#D1D5DB' }}>正方</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isUp ? <TrendingUp className="w-4 h-4" style={{ color: '#1E3A8A' }} /> :
             isDown ? <TrendingDown className="w-4 h-4" style={{ color: '#F59E0B' }} /> :
             <Minus className="w-4 h-4" style={{ color: '#D1D5DB' }} />}
            <span className={`text-lg font-extrabold ${isUp ? '' : ''}`}
              style={{ color: isUp ? '#1E3A8A' : isDown ? '#F59E0B' : '#6B7280' }}>
              {isUp ? '+' : ''}{change}%
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ color: '#6B7280' }}>今天</span>
              <span className="text-sm font-bold" style={{ color: '#1E3A8A' }}>{forPct}%</span>
              <span className="text-[10px]" style={{ color: '#D1D5DB' }}>正方</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          {(isUp || isDown) && (
            <p className="text-xs font-medium" style={{ color: isUp ? '#1E3A8A' : '#F59E0B' }}>
              {isUp ? '正方正在扩大优势' : '反方正在追赶'}
            </p>
          )}
          <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{snapshot.total_participants} → {total} 人参与</p>
        </div>
      </div>
    </div>
  )
}
