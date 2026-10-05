import { createClient } from '@/lib/supabase/server'
import { getUser, checkIsAdmin } from '@/lib/auth'
import { CommentForm } from '@/components/CommentForm'
import { CommentList } from '@/components/CommentList'
import { ArgumentShowdown } from '@/components/ArgumentShowdown'
import { TopicTrend } from '@/components/TopicTrend'
import { StanceHistory } from '@/components/StanceHistory'
import { ReportButton } from '@/components/ReportButton'
import { ShareButton } from '@/components/ShareButton'
import { SidePicker } from '@/components/SidePicker'
import { LiveTopic } from '@/components/LiveTopic'
import { ArrowLeft, Users, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Side, TopicWithCounts } from '@/types'

const getTopicWithCounts = cache(async (id: string): Promise<TopicWithCounts | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_topic_with_counts', { topic_id: id })
  if (error || !data || data.length === 0) return null
  const t = data[0]
  return {
    id: t.id, title: t.title, description: t.description,
    status: t.status, category: t.category || '科技',
    starts_at: t.starts_at, ends_at: t.ends_at,
    final_for_count: t.final_for_count, final_against_count: t.final_against_count,
    created_by: t.created_by, created_at: t.created_at,
    for_count: Number(t.for_count), against_count: Number(t.against_count),
    total_participants: Number(t.for_count) + Number(t.against_count),
    switch_for_to_against: Number(t.switch_fa),
    switch_against_to_for: Number(t.switch_af),
  } as TopicWithCounts
})

function formatTimeLeft(endsAt: string): string {
  const now = Date.now(); const end = new Date(endsAt).getTime(); const diff = end - now
  if (diff <= 0) return '已结束'
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `剩余 ${days} 天`
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (hours > 0) return `剩余 ${hours} 小时`
  return '即将结束'
}

export default async function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const topic = await getTopicWithCounts(id)
  if (!topic) notFound()

  const user = await getUser()
  const isActive = topic.status === 'active'
  const total = topic.for_count + topic.against_count
  const forPct = total > 0 ? Math.round((topic.for_count / total) * 100) : 50
  const diff = Math.abs(topic.for_count - topic.against_count)
  const { count: opinionCount } = await createClient().then(s => s.from('comments').select('*', { count: 'exact', head: true }).eq('topic_id', id))

  let userSide: Side | null = null
  if (user) {
    const supabase = await createClient()
    const { data: aff } = await supabase.from('affiliations').select('side').eq('user_id', user.id).eq('topic_id', id).maybeSingle()
    if (aff) userSide = aff.side
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-5">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: '#94A3B8' }}>
        <ArrowLeft className="w-3.5 h-3.5" />返回
      </Link>

      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>
          {(topic as any).category}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          {user && <ReportButton type="topic" reportedId={id} />}
          <ShareButton url={`/topics/${id}`} title={topic.title} />
        </div>
      </div>
      <h1 className="text-xl font-bold tracking-tight mb-2" style={{ color: '#0F172A' }}>{topic.title}</h1>
      {topic.description && (
        <p className="text-sm mb-6 leading-relaxed" style={{ color: '#64748B' }}>{topic.description}</p>
      )}

      {/* === VS SCOREBOARD (48px gap from above) === */}
      <div className="flex items-stretch gap-0 mb-3 rounded-xl overflow-hidden border shadow-subtle bg-white" style={{ borderColor: '#E2E8F0' }}>
        <div className="flex-1 py-5 text-center" style={{ backgroundColor: userSide === 'for' ? '#EFF6FF' : 'transparent' }}>
          <p className="text-[36px] font-bold tracking-tight tabular-nums" style={{ color: '#2563EB' }}>{topic.for_count}</p>
          <p className="text-xs font-bold mt-1" style={{ color: '#2563EB' }}>正方 · {forPct}%</p>
        </div>
        <div className="flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#F8FAFC' }}>
          <span className="text-2xl select-none" style={{ color: '#94A3B8' }}>⚔</span>
          {total > 0 && (
            <span className="text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-full" style={{
              backgroundColor: diff === 0 ? '#FEF3C7' : '#F1F5F9',
              color: diff === 0 ? '#F59E0B' : '#94A3B8'
            }}>
              {diff === 0 ? '持平' : `差${diff}票`}
            </span>
          )}
          <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: '#94A3B8' }}>
            <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5"/>{total}人</span>
            <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5"/>{opinionCount || 0}观点</span>
            <StanceHistory topicId={id} />
          </div>
        </div>
        <div className="flex-1 py-5 text-center" style={{ backgroundColor: userSide === 'against' ? '#EFF6FF' : 'transparent' }}>
          <p className="text-[36px] font-bold tracking-tight tabular-nums" style={{ color: '#94A3B8' }}>{topic.against_count}</p>
          <p className="text-xs font-bold mt-1" style={{ color: '#94A3B8' }}>反方 · {100-forPct}%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden flex mb-6" style={{ backgroundColor: '#F1F5F9' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${forPct}%`, backgroundColor: '#2563EB' }} />
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${100-forPct}%`, backgroundColor: '#94A3B8' }} />
      </div>

      {/* Stance picker */}
      {isActive && (
        <div className="mb-3">
          <SidePicker topicId={id} currentSide={userSide} isLoggedIn={!!user} forCount={topic.for_count} againstCount={topic.against_count} />
        </div>
      )}

      {/* Opinion thermometer */}
      {userSide && total > 0 && (
        <div className="mb-6 p-3 rounded-lg text-center text-sm" style={{
          backgroundColor: userSide === 'for' ? (forPct >= 50 ? '#F0FDF4' : '#FFF7ED') : (100-forPct >= 50 ? '#F0FDF4' : '#FFF7ED'),
          border: '1px solid ' + (userSide === 'for' ? (forPct >= 50 ? '#BBF7D0' : '#FED7AA') : (100-forPct >= 50 ? '#BBF7D0' : '#FED7AA')),
        }}>
          {((userSide === 'for' && forPct >= 50) || (userSide === 'against' && 100-forPct >= 50)) ? (
            <span>🌊 你属于 <strong>多数派</strong>——当前 {userSide === 'for' ? forPct : 100-forPct}% 的用户和你立场一致</span>
          ) : (
            <span>🗽 你属于 <strong>少数派</strong>——仅 {userSide === 'for' ? forPct : 100-forPct}% 的用户站在你这边，你的观点格外重要</span>
          )}
        </div>
      )}

      {/* Topic Trend */}
      <div className="mb-6">
        <TopicTrend topicId={id} />
      </div>

      {/* Argument Showdown */}
      <div className="mb-6 shadow-subtle rounded-xl">
        <ArgumentShowdown topicId={id} />
      </div>

      {/* Comments */}
      {isActive && <div className="mb-6"><CommentForm topicId={id} userSide={userSide} isLoggedIn={!!user} /></div>}
      <CommentList topicId={id} currentUser={user} isAdmin={user ? await checkIsAdmin(user.id) : false} />
      <LiveTopic topicId={id} />
    </div>
  )
}
