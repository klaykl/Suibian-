import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingUp, Clock, Users, Newspaper } from 'lucide-react'
import { cache } from 'react'

const HOT_KEYWORDS = ['Apple Vision Pro','全球气温','四天工作制','AI生成内容','年轻人','电动汽车','短剧','大城市','预制菜','远程办公','短视频平台','冷冻卵子']

const getHotTopics = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_topics_with_counts')
  if (error || !data) return []
  return data.filter((t: any) => HOT_KEYWORDS.some(k => t.title.includes(k)) && t.status === 'active')
    .map((t: any) => ({
      id: t.id, title: t.title, description: t.description,
      for_count: Number(t.for_count), against_count: Number(t.against_count),
      total_participants: Number(t.for_count) + Number(t.against_count),
      category: t.category, ends_at: t.ends_at,
    }))
})

function formatTimeLeft(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return '已结束'
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `剩余 ${hours} 小时`
  return `剩余 ${Math.floor(hours/24)} 天`
}

export default async function HotPage() {
  const topics = await getHotTopics()

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🔥</span>
          <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>热点速辩</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>24h 更新</span>
        </div>
        <p className="text-sm" style={{ color: '#64748B' }}>基于实时新闻引发的辩论，参与热点讨论</p>
      </div>

      {topics.length === 0 ? (
        <div className="text-center py-20" style={{ color: '#94A3B8' }}>暂无热点话题</div>
      ) : (
        <div className="space-y-4">
          {/* Featured first topic */}
          {topics[0] && (
            <Link href={`/topics/${topics[0].id}`}
              className="block rounded-xl overflow-hidden border hover:shadow-md transition-all"
              style={{ borderColor: '#F59E0B30', backgroundColor: '#FFFDF5' }}>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    🔥 今日最热
                  </span>
                  <span className="text-xs" style={{ color: '#94A3B8' }}>{topics[0].category}</span>
                </div>
                <h2 className="text-xl font-extrabold mb-3" style={{ color: '#0F172A' }}>{topics[0].title}</h2>

                {/* Controversy summary */}
                {topics[0].description && (
                  <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#F8FAFC' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Newspaper className="w-3.5 h-3.5" style={{ color: '#64748B' }} />
                      <span className="text-xs font-bold" style={{ color: '#64748B' }}>新闻背景</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{topics[0].description}</p>
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs" style={{ color: '#64748B' }}>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /><span className="font-bold" style={{ color: '#0F172A' }}>{topics[0].total_participants}</span> 人参与</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeLeft(topics[0].ends_at)}</span>
                  {topics[0].total_participants > 0 && (
                    <span className="font-bold" style={{ color: '#2563EB' }}>
                      正方 {Math.round(topics[0].for_count / topics[0].total_participants * 100)}%
                    </span>
                  )}
                  <span className="ml-auto px-3 py-1 rounded-full text-white text-xs font-bold" style={{ backgroundColor: '#F59E0B' }}>
                    进入辩论 →
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Remaining topics */}
          {topics.slice(1).map((t: any) => (
            <Link key={t.id} href={`/topics/${t.id}`}
              className="block p-4 rounded-xl border hover:shadow-sm transition-all bg-white"
              style={{ borderColor: '#F1F5F9' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F3F4F6', color: '#64748B' }}>
                      {t.category}
                    </span>
                    <span className="text-xs" style={{ color: '#94A3B8' }}>{formatTimeLeft(t.ends_at)}</span>
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: '#0F172A' }}>{t.title}</h3>
                  {t.description && (
                    <p className="text-xs mt-1 line-clamp-1" style={{ color: '#64748B' }}>{t.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold" style={{ color: '#0F172A' }}>{t.total_participants} 人</p>
                  {t.total_participants > 0 && (
                    <p className="text-[10px] mt-0.5" style={{ color: '#2563EB' }}>
                      正方 {Math.round(t.for_count / t.total_participants * 100)}%
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
