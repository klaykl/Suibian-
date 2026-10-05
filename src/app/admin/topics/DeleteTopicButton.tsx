'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function DeleteTopicButton({ topicId, topicTitle }: { topicId: string; topicTitle: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()

    // Delete all related data
    const { error } = await supabase.from('topics').delete().eq('id', topicId)

    if (error) {
      toast.error('删除失败: ' + error.message)
    } else {
      toast.success('话题已删除')
      router.refresh()
    }
    setLoading(false)
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? '删除中...' : '确认'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 text-stone-500 hover:text-stone-700"
        >
          取消
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-stone-400 hover:text-red-500 transition-colors p-1"
      title="删除话题"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
