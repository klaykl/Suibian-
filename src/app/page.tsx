import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { CategoryTabs } from '@/components/CategoryTabs'
import { Sidebar } from '@/components/Sidebar'
import { TopicFeed } from '@/components/TopicFeed'
import { cache } from 'react'
import { TrendingUp, Sparkles, Users } from 'lucide-react'
import Link from 'next/link'

const getStats = cache(async () => {
  const supabase = await createClient()
  const { count: topics } = await supabase.from('topics').select('*', { count: 'exact', head: true })
  const { data } = await supabase.rpc('get_topics_with_counts')
  return {
    topics: topics || 0,
    participants: (data || []).reduce((s: number, t: any) => s + Number(t.for_count) + Number(t.against_count), 0),
  }
})

const getHotTopics = cache(async () => {
  const supabase = await createClient()
  const HOT_KEYWORDS = ['Apple Vision Pro','全球气温','四天工作制','AI生成内容','年轻人','电动汽车','短剧','大城市','预制菜','远程办公','短视频平台','冷冻卵子']
  const { data } = await supabase.rpc('get_topics_with_counts')
  const active = (data || []).filter((t: any) => t.status === 'active')
  const keywordMatched = active.filter((t: any) => HOT_KEYWORDS.some(k => t.title.includes(k)))
  const keywordIds = new Set(keywordMatched.map((t: any) => t.id))
  const fallback = active
    .filter((t: any) => !keywordIds.has(t.id))
    .sort((a: any, b: any) => (Number(b.for_count) + Number(b.against_count)) - (Number(a.for_count) + Number(a.against_count)))
  return [...keywordMatched, ...fallback]
    .sort((a: any, b: any) => (Number(b.for_count) + Number(b.against_count)) - (Number(a.for_count) + Number(a.against_count)))
    .slice(0, 5)
})

export const dynamic = 'force-dynamic'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams
  const stats = await getStats()
  const hotTopics = await getHotTopics()
  const user = await getUser()
  const feedKey = Date.now()

  return (
    <div className="mx-auto max-w-5xl px-6 py-5">
      {!user && (
        <div className="mb-4 p-4 rounded-xl flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)' }}>
          <div>
            <p className="text-white font-bold text-sm">加入随辩，表达你的观点</p>
            <p className="text-blue-100 text-xs mt-0.5">选择立场，参与辩论，随时改变想法</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-4 py-1.5 text-sm font-bold text-white rounded-lg hover:bg-white/10 transition-colors border border-white/30">登录</Link>
            <Link href="/register" className="px-4 py-1.5 text-sm font-bold rounded-lg transition-colors" style={{ backgroundColor: '#F59E0B', color: '#0F172A' }}>注册</Link>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <h1 className="text-[22px] font-extrabold tracking-tight" style={{ color: '#0F172A' }}>随辩</h1>
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>
              选择立场，表达观点，随时改变想法
              <span className="mx-2" style={{ color: '#D1D5DB' }}>·</span>
              <span className="font-semibold" style={{ color: '#2563EB' }}>累计 {stats.topics} 个话题</span>
              <span className="mx-1" style={{ color: '#D1D5DB' }}>·</span>
              <span className="font-semibold" style={{ color: '#2563EB' }}>累计 {stats.participants.toLocaleString()} 人参与</span>
            </p>
          </div>

          <CategoryTabs current={cat} />

          {!cat && hotTopics[0] && (
            <Link href={`/topics/${hotTopics[0].id}`}
              className="block mb-4 p-5 rounded-xl overflow-hidden transition-all hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, rgba(255,251,235,0.9), rgba(255,255,255,1))', boxShadow: '0 4px 24px -4px rgba(245,158,11,0.12)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: '#F59E0B' }} />
                <span className="text-sm font-bold" style={{ color: '#0F172A' }}>今日最值得辩论</span>
              </div>
              <h2 className="text-base font-extrabold mb-2" style={{ color: '#0F172A' }}>{(hotTopics[0] as any).title}</h2>
              <div className="flex items-center gap-4 text-xs" style={{ color: '#64748B' }}>
                <span className="flex items-center gap-1"><Users className="w-3 h-3"/>{(hotTopics[0] as any).for_count + (hotTopics[0] as any).against_count} 人参与</span>
                <span>正方 {Math.round((hotTopics[0] as any).for_count / Math.max(1, (hotTopics[0] as any).for_count + (hotTopics[0] as any).against_count) * 100)}%</span>
                <span className="font-semibold px-4 py-1.5 rounded-full text-white ml-auto text-xs"
                  style={{ backgroundColor: '#F59E0B', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>立即加入</span>
              </div>
            </Link>
          )}

          {!cat && hotTopics.length > 1 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
                <span className="text-xs font-bold" style={{ color: '#64748B' }}>热点速辩</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {hotTopics.slice(1).map((t: any) => {
                  const tTotal = Number(t.for_count) + Number(t.against_count)
                  const tForPct = tTotal > 0 ? Math.round((Number(t.for_count) / tTotal) * 100) : 50
                  return (
                  <Link key={t.id} href={`/topics/${t.id}`}
                    className="shrink-0 bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                    style={{ width: '180px' }}>
                    <p className="text-xs font-medium line-clamp-2 mb-2" style={{ color: '#0F172A' }}>{t.title}</p>
                    <div className="h-1 rounded-full overflow-hidden flex mb-1.5" style={{ backgroundColor: '#F1F5F9' }}>
                      <div className="h-full rounded-full" style={{ width: `${tForPct}%`, backgroundColor: '#2563EB' }} />
                      <div className="h-full rounded-full" style={{ width: `${100 - tForPct}%`, backgroundColor: '#E2E8F0' }} />
                    </div>
                    <p className="text-[10px]" style={{ color: '#94A3B8' }}>🔥 {tTotal} 人参与</p>
                  </Link>
                )})}
              </div>
            </div>
          )}

          <TopicFeed category={cat} refreshKey={feedKey} />
        </div>

        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-16" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  )
}
