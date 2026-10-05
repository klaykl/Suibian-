'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeftRight, MessageSquare, ChevronDown } from 'lucide-react'

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: switches } = await supabase.rpc('get_recent_switches', { limit_count: 20 })
      const hourAgo = new Date(Date.now() - 3600000).toISOString()
      const { data: recentComments } = await supabase.from('comments')
        .select('id, body, user_id, topic_id, created_at, profiles:user_id(username), topics:topic_id(title)')
        .gte('created_at', hourAgo).order('created_at', { ascending: false }).limit(10)

      const merged: { type: string; time: Date; content: any }[] = []
      if (switches) (switches as any[]).forEach(s => merged.push({ type: 'switch', time: new Date(s.changed_at), content: s }))
      if (recentComments) (recentComments as any[]).forEach(c => merged.push({ type: 'comment', time: new Date(c.created_at), content: c }))
      merged.sort((a, b) => b.time.getTime() - a.time.getTime())
      setActivities(merged.slice(0, 30))
    }
    load()
  }, [])

  function timeAgo(d: Date): string {
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}小时前`
    return `${Math.floor(hrs/24)}天前`
  }

  if (activities.length === 0) return <p className="text-xs py-4 text-center" style={{ color: '#9CA3AF' }}>暂无动态</p>

  const visible = expanded ? activities : activities.slice(0, 3)

  return (
    <div>
      {visible.map((act, i) => {
        if (act.type === 'switch') {
          const s = act.content
          return (
            <Link key={`s-${i}`} href={`/topics/${s.topic_id}`}
              className="flex items-start gap-2 py-2 hover:bg-gray-50 rounded-md px-1 -mx-1 transition-colors">
              <ArrowLeftRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#F59E0B' }} />
              <div className="min-w-0">
                <p className="text-xs" style={{ color: '#4B5563' }}>
                  <span className="font-semibold" style={{ color: '#111827' }}>@{s.username}</span>
                  {' '}改变了立场
                </p>
                <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: '#9CA3AF' }}>
                  {s.from_side === 'for' ? '正方 → 反方' : '反方 → 正方'} · {s.topic_title}
                </p>
              </div>
              <span className="text-[10px] shrink-0 ml-auto" style={{ color: '#D1D5DB' }}>{timeAgo(act.time)}</span>
            </Link>
          )
        }
        const c = act.content
        return (
          <Link key={`c-${i}`} href={`/topics/${c.topic_id}`}
            className="flex items-start gap-2 py-2 hover:bg-gray-50 rounded-md px-1 -mx-1 transition-colors">
            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#6B7280' }} />
            <div className="min-w-0">
              <p className="text-xs" style={{ color: '#4B5563' }}>
                <span className="font-semibold" style={{ color: '#111827' }}>@{c.profiles?.username}</span>
                {' '}发表了观点
              </p>
              <p className="text-[10px] mt-0.5 line-clamp-1" style={{ color: '#9CA3AF' }}>
                {c.body} · {c.topics?.title}
              </p>
            </div>
            <span className="text-[10px] shrink-0 ml-auto" style={{ color: '#D1D5DB' }}>{timeAgo(act.time)}</span>
          </Link>
        )
      })}
      {activities.length > 3 && (
        <button onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-xs py-1.5 mt-1 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
          style={{ color: '#6B7280' }}>
          {expanded ? '收起' : `查看全部 ${activities.length} 条动态`}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}
