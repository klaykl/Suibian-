import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Swords, ThumbsUp, Star } from 'lucide-react'

export async function ArgumentShowdown({ topicId }: { topicId: string }) {
  const supabase = await createClient()

  const { data: forComment } = await supabase.from('comments')
    .select('*, profiles:user_id(username, avatar_url)')
    .eq('topic_id', topicId).eq('side_at_time', 'for')
    .order('upvote_count', { ascending: false }).limit(1).single()

  const { data: againstComment } = await supabase.from('comments')
    .select('*, profiles:user_id(username, avatar_url)')
    .eq('topic_id', topicId).eq('side_at_time', 'against')
    .order('upvote_count', { ascending: false }).limit(1).single()

  if (!forComment && !againstComment) return null

  return (
    <div className="rounded-xl overflow-hidden shadow-subtle">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 bg-white">
        <Swords className="w-4 h-4" style={{ color: '#F59E0B' }} />
        <span className="text-sm font-bold" style={{ color: '#111827' }}>观点对决</span>
        <span className="text-xs" style={{ color: '#9CA3AF' }}>双方最佳论据</span>
      </div>

      <div className="flex items-stretch">
        {/* Pro side — blue tint */}
        <div className="flex-1 p-4" style={{ backgroundColor: '#F8FAFF' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1E3A8A', color: '#fff' }}>正方</span>
            <span className="text-[10px]" style={{ color: '#6B7280' }}>最佳论据</span>
          </div>
          {forComment ? (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                {(forComment as any).profiles?.avatar_url ? (
                  <img src={(forComment as any).profiles.avatar_url} className="w-7 h-7 rounded-full" alt="" />
                ) : (
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: '#1E3A8A' }}>
                    {((forComment as any).profiles?.username || '?')[0]}
                  </span>
                )}
                <span className="text-sm font-semibold" style={{ color: '#1E3A8A' }}>@{(forComment as any).profiles?.username}</span>
                <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#6B7280' }}>
                  <ThumbsUp className="w-3 h-3" /> {(forComment as any).upvote_count}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{(forComment as any).body}</p>
            </div>
          ) : (
            <p className="text-sm italic py-4" style={{ color: '#D1D5DB' }}>暂无论据，快来发表</p>
          )}
        </div>

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#F3F4F6' }}>
          <span className="text-2xl font-black tracking-widest" style={{ color: '#9CA3AF' }}>VS</span>
        </div>

        {/* Con side — gray tint */}
        <div className="flex-1 p-4" style={{ backgroundColor: '#F9FAFB' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#6B7280', color: '#fff' }}>反方</span>
            <span className="text-[10px]" style={{ color: '#6B7280' }}>最佳论据</span>
          </div>
          {againstComment ? (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                {(againstComment as any).profiles?.avatar_url ? (
                  <img src={(againstComment as any).profiles.avatar_url} className="w-7 h-7 rounded-full" alt="" />
                ) : (
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: '#6B7280' }}>
                    {((againstComment as any).profiles?.username || '?')[0]}
                  </span>
                )}
                <span className="text-sm font-semibold" style={{ color: '#374151' }}>@{(againstComment as any).profiles?.username}</span>
                <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#6B7280' }}>
                  <ThumbsUp className="w-3 h-3" /> {(againstComment as any).upvote_count}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{(againstComment as any).body}</p>
            </div>
          ) : (
            <p className="text-sm italic py-4" style={{ color: '#D1D5DB' }}>暂无论据，快来发表</p>
          )}
        </div>
      </div>
    </div>
  )
}
