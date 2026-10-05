'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Send } from 'lucide-react'
import type { Side } from '@/types'

interface Props {
  topicId: string
  userSide: Side | null
  isLoggedIn: boolean
}

export function CommentForm({ topicId, userSide, isLoggedIn }: Props) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn) { toast.error('请先登录'); router.push('/login'); return }
    if (!userSide) { toast.error('请先选择立场再发表观点'); return }

    const trimmed = body.trim()
    if (!trimmed) { toast.error('请输入内容'); return }
    if (trimmed.length > 2000) { toast.error('内容不能超过 2000 字'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('请先登录'); setLoading(false); return }

    const { error } = await supabase.from('comments').insert({
      topic_id: topicId, user_id: user.id, body: trimmed, side_at_time: userSide,
    })
    if (error) { toast.error('发布失败'); setLoading(false); return }

    toast.success('已发布')
    setBody('')
    router.refresh()
    setLoading(false)
  }

  const placeholder = !isLoggedIn ? '登录后发表观点...' : !userSide ? '选择正方或反方后发表观点...' : '写下你的观点，用论据说服对方...'
  const disabled = !isLoggedIn || !userSide

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-subtle px-4 py-3">
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder} rows={1} maxLength={2000} disabled={disabled}
        className="w-full border-0 resize-none text-sm focus:outline-none text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 leading-relaxed"
        style={{ minHeight: '36px', maxHeight: '200px' }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement
          target.style.height = '36px'
          target.style.height = Math.min(target.scrollHeight, 200) + 'px'
        }}
      />
      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border">
        <div className="flex items-center gap-2">
          {userSide && (
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
              userSide === 'for' ? 'bg-blue-50 text-zhihu-blue' : 'bg-red-50 text-zhihu-red'
            }`}>
              {userSide === 'for' ? '正方' : '反方'}
            </span>
          )}
          <span className="text-xs text-gray-400">{body.length}/2000</span>
        </div>
        <button type="submit" disabled={loading || !body.trim() || disabled}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-zhihu-blue text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <Send className="w-3.5 h-3.5" />
          {loading ? '发布中...' : '发布'}
        </button>
      </div>
    </form>
  )
}
