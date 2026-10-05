import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCreateForm } from './AdminCreateForm'
import { DeleteTopicButton } from './DeleteTopicButton'
import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'

async function getAdminTopics() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('topics')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export default async function AdminTopicsPage() {
  await requireAdmin()

  const topics = await getAdminTopics()

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        返回首页
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-5 h-5 text-stone-700" />
        <h1 className="text-xl font-bold text-stone-900">话题管理</h1>
      </div>

      {/* 创建新话题 */}
      <div className="bg-white rounded-md border border-gray-100 p-6 mb-8 shadow-sm">
        <h2 className="font-semibold text-stone-900 mb-5">创建新话题</h2>
        <AdminCreateForm />
      </div>

      {/* 话题列表 */}
      <div>
        <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wider mb-3">
          所有话题 ({topics.length})
        </h2>
        {topics.length === 0 ? (
          <p className="text-stone-400 text-sm py-8 text-center">暂无话题</p>
        ) : (
          <div className="space-y-2">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center justify-between bg-white rounded-xl border border-stone-200 px-5 py-3.5 hover:border-stone-300 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-900 truncate">{topic.title}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {topic.status === 'active' ? '进行中' : '已结束'} ·{' '}
                    截止 {new Date(topic.ends_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      topic.status === 'active'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {topic.status === 'active' ? '进行中' : '已结束'}
                  </span>
                  <DeleteTopicButton topicId={topic.id} topicTitle={topic.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
