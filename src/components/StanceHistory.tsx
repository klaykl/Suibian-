'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeftRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export function StanceHistory({ topicId }: { topicId: string }) {
  const [changes, setChanges] = useState<any[]>([])
  const [f2aCount, setF2aCount] = useState(0)
  const [a2fCount, setA2fCount] = useState(0)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('affiliation_changes')
        .select('*, profiles:user_id(username)')
        .eq('topic_id', topicId).order('changed_at', { ascending: false }).limit(20)
      const { count: f2a } = await supabase.from('affiliation_changes')
        .select('*', { count: 'exact', head: true }).eq('topic_id', topicId).eq('from_side', 'for').eq('to_side', 'against')
      const { count: a2f } = await supabase.from('affiliation_changes')
        .select('*', { count: 'exact', head: true }).eq('topic_id', topicId).eq('from_side', 'against').eq('to_side', 'for')
      if (data) setChanges(data)
      setF2aCount(f2a || 0)
      setA2fCount(a2f || 0)
    }
    load()
  }, [topicId])

  if (changes.length === 0) return null

  function timeAgo(d: string): string {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'; if (mins < 60) return `${mins}分钟前`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}小时前`; return `${Math.floor(hrs/24)}天前`
  }

  return (
    <div>
      {/* Collapsed: clickable stat */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs transition-colors hover:underline"
        style={{ color: '#F59E0B' }}
      >
        <ArrowLeftRight className="w-3 h-3" />
        <span className="font-bold">{changes.length}</span> 人改变立场
        <span className="mx-1" style={{ color: '#D1D5DB' }}>·</span>
        <span style={{ color: '#64748B' }}>正→反 {f2aCount}</span>
        <span className="mx-1" style={{ color: '#D1D5DB' }}>·</span>
        <span style={{ color: '#64748B' }}>反→正 {a2fCount}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded list */}
      {expanded && (
        <div className="mt-2 p-3 rounded-lg animate-fade-in" style={{ backgroundColor: '#FEF3C7' }}>
          <div className="space-y-1.5">
            {changes.slice(0, 8).map((c, i) => (
              <div key={c.id || i} className="flex items-center gap-2 text-xs py-0.5">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                  style={{ backgroundColor: '#F59E0B' }}>
                  {(c.profiles?.username || '?')[0]}
                </span>
                <Link href={`/users/${c.user_id}`} className="font-bold hover:underline" style={{ color: '#0F172A' }}>
                  @{c.profiles?.username}
                </Link>
                <span style={{ color: '#64748B' }}>
                  {c.from_side === 'for' ? '正方 → 反方' : '反方 → 正方'}
                </span>
                <span className="ml-auto" style={{ color: '#94A3B8' }}>{timeAgo(c.changed_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
