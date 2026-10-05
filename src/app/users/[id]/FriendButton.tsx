'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export function FriendButton({ userId, targetId, initialStatus, targetName }: {
  userId: string; targetId: string; initialStatus: string; targetName: string
}) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggleFollow() {
    setLoading(true)
    const supabase = createClient()

    if (status === 'accepted' || status === 'pending') {
      // Unfollow
      const { error } = await supabase.from('friends').delete()
        .eq('user_id', userId).eq('friend_id', targetId)
      if (error) toast.error('操作失败')
      else { setStatus('none'); toast.success('已取消关注') }
    } else {
      // Follow (one-way, auto-accepted)
      const { error } = await supabase.from('friends').upsert({
        user_id: userId, friend_id: targetId, status: 'accepted',
      }, { onConflict: 'user_id,friend_id' })
      if (error) toast.error('操作失败')
      else { setStatus('accepted'); toast.success('已关注 ' + targetName) }
    }
    setLoading(false)
    router.refresh()
  }

  if (status === 'accepted') {
    return (
      <button onClick={toggleFollow} disabled={loading}
        className="px-4 py-2 text-sm bg-gray-100 text-gray-500 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors flex items-center gap-1.5">
        <UserCheck className="w-4 h-4"/>已关注
      </button>
    )
  }

  return (
    <button onClick={toggleFollow} disabled={loading}
      className="px-4 py-2 text-sm bg-zhihu-blue text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5">
      <UserPlus className="w-4 h-4"/>关注
    </button>
  )
}
