'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, UserMinus, UserX } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export function FollowListModal({ userId, type, open, onClose }: {
  userId: string; type: 'following' | 'followers'; open: boolean; onClose: () => void
}) {
  const [users, setUsers] = useState<{ id: string; username: string; avatar_url: string | null }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    loadData()
  }, [open, userId, type])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    if (type === 'following') {
      const { data: friends } = await supabase.from('friends').select('friend_id').eq('user_id', userId).eq('status', 'accepted')
      const ids = (friends || []).map(f => f.friend_id)
      if (ids.length === 0) { setUsers([]); setLoading(false); return }
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', ids)
      setUsers((profiles || []).map(p => ({ id: p.id, username: p.username, avatar_url: p.avatar_url })))
    } else {
      const { data: followers } = await supabase.from('friends').select('user_id').eq('friend_id', userId).eq('status', 'accepted')
      const ids = (followers || []).map(f => f.user_id)
      if (ids.length === 0) { setUsers([]); setLoading(false); return }
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', ids)
      setUsers((profiles || []).map(p => ({ id: p.id, username: p.username, avatar_url: p.avatar_url })))
    }
    setLoading(false)
  }

  async function handleUnfollow(targetId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('friends').delete()
      .eq('user_id', userId).eq('friend_id', targetId)
    if (error) { toast.error('操作失败'); return }
    toast.success('已取消关注')
    setUsers(prev => prev.filter(u => u.id !== targetId))
  }

  async function handleRemoveFollower(targetId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('friends').delete()
      .eq('user_id', targetId).eq('friend_id', userId)
    if (error) { toast.error('操作失败'); return }
    toast.success('已移除粉丝')
    setUsers(prev => prev.filter(u => u.id !== targetId))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 max-h-96 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">{type === 'following' ? '关注' : '粉丝'}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <p className="text-center text-sm text-gray-400 py-8">加载中...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">暂无</p>
          ) : (
            users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors group">
                <Link href={`/users/${u.id}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0">
                  {u.avatar_url ? <img src={u.avatar_url} className="w-9 h-9 rounded-full shrink-0" alt=""/> :
                    <span className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">{(u.username||'?')[0].toUpperCase()}</span>}
                  <span className="text-sm font-medium text-gray-800 truncate">{u.username}</span>
                </Link>
                {type === 'following' ? (
                  <button onClick={() => handleUnfollow(u.id)}
                    className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <UserMinus className="w-3.5 h-3.5"/>
                  </button>
                ) : (
                  <button onClick={() => handleRemoveFollower(u.id)}
                    className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <UserX className="w-3.5 h-3.5"/>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
