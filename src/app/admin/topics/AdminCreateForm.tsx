'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const DURATIONS = [
  { label: '1 天', value: 1 },
  { label: '3 天', value: 3, recommended: true },
  { label: '5 天', value: 5 },
  { label: '7 天', value: 7 },
]

export function AdminCreateForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(3)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('请输入话题标题')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('请先登录')
      setLoading(false)
      return
    }

    const startsAt = new Date()
    const endsAt = new Date(startsAt.getTime() + duration * 24 * 60 * 60 * 1000)

    const { error } = await supabase.from('topics').insert({
      title: title.trim(),
      description: description.trim() || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      created_by: user.id,
    })

    if (error) {
      toast.error('创建失败: ' + error.message)
    } else {
      toast.success('话题已创建')
      setTitle('')
      setDescription('')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          话题标题
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：AI会取代初级程序员吗？"
          required
          className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-zhihu-blue focus:bg-white transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          背景描述 <span className="text-stone-400 font-normal">(可选)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="为这个话题提供一些背景信息..."
          rows={2}
          className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-zhihu-blue focus:bg-white transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          <Clock className="w-3.5 h-3.5 inline mr-1" />
          持续时间
        </label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDuration(d.value)}
              className={`px-4 py-2 text-sm rounded-xl border-2 transition-all ${
                duration === d.value
                  ? 'border-zhihu-blue bg-blue-50 text-zhihu-blue font-semibold'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              {d.label}
              {d.recommended && (
                <span className="block text-[10px] text-stone-400 font-normal">推荐</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-zhihu-blue text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        {loading ? '创建中...' : '创建话题'}
      </button>
    </form>
  )
}
