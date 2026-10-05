import { createClient } from '@/lib/supabase/server'
import { TopicCard } from '@/components/TopicCard'
import { cache } from 'react'
import type { TopicWithCounts } from '@/types'

const THEMES = [
  { key: 'AI', label: '🤖 AI 时代', desc: '人工智能如何改变世界' },
  { key: '教育', label: '📚 教育反思', desc: '学习的本质与未来' },
  { key: '职场', label: '💼 职场进化', desc: '工作方式的变革' },
  { key: '科技', label: '💻 科技前沿', desc: '技术趋势与争议' },
  { key: '哲学', label: '🤔 深度思考', desc: '人生的根本问题' },
  { key: '生活', label: '🌟 生活方式', desc: '如何更好地生活' },
  { key: '社会', label: '🏛️ 社会观察', desc: '现象背后的逻辑' },
  { key: '商业', label: '📈 商业洞见', desc: '市场与商业逻辑' },
]

const getTopicsByTheme = cache(async (theme: string): Promise<TopicWithCounts[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_topics_with_counts')
  if (error || !data) return []
  return data
    .filter((t: any) => t.category === theme)
    .map((t: any) => ({
      id: t.id, title: t.title, description: t.description,
      status: t.status, category: t.category || '科技',
      starts_at: t.starts_at, ends_at: t.ends_at,
      final_for_count: 0, final_against_count: 0,
      created_by: '', created_at: t.created_at,
      for_count: Number(t.for_count), against_count: Number(t.against_count),
      total_participants: Number(t.for_count) + Number(t.against_count),
      switch_for_to_against: Number(t.switch_fa),
      switch_against_to_for: Number(t.switch_af),
    } as TopicWithCounts))
})

export default async function ThemesPage() {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_topics_with_counts')
  if (!data) return <div className="text-center py-16 text-gray-400">暂无数据</div>

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">主题广场</h1>
      <div className="space-y-8">
        {THEMES.map(theme => {
          const topics = data
            .filter((t: any) => t.category === theme.key)
            .map((t: any) => ({
              id: t.id, title: t.title, description: t.description,
              status: t.status, category: t.category || '科技',
              starts_at: t.starts_at, ends_at: t.ends_at,
              final_for_count: 0, final_against_count: 0,
              created_by: '', created_at: t.created_at,
              for_count: Number(t.for_count), against_count: Number(t.against_count),
              total_participants: Number(t.for_count) + Number(t.against_count),
              switch_for_to_against: Number(t.switch_fa),
              switch_against_to_for: Number(t.switch_af),
            } as TopicWithCounts))

          if (topics.length === 0) return null

          return (
            <section key={theme.key}>
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-gray-800">{theme.label}</h2>
                <p className="text-sm text-gray-400">{theme.desc}</p>
              </div>
              <div className="space-y-2">
                {topics.slice(0, 3).map((t: TopicWithCounts) => <TopicCard key={t.id} topic={t} />)}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
