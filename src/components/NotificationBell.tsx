'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, ThumbsUp, MessageCircle, Flag } from 'lucide-react'

interface Notification {
  id: string
  type: 'upvote' | 'reply' | 'report_resolved'
  read: boolean
  created_at: string
  topic_id: string | null
  comment_id: string | null
  from_username?: string
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchNotifications() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error || !data) { setLoading(false); return }

      const fromIds = [...new Set(data.filter(n => n.from_user_id).map(n => n.from_user_id))]
      const usernameMap = new Map<string, string>()
      if (fromIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', fromIds)
        if (profiles) profiles.forEach(p => usernameMap.set(p.id, p.username))
      }

      const enriched = data.map(n => ({
        ...n,
        from_username: usernameMap.get(n.from_user_id) || '匿名',
      }))

      setNotifications(enriched)
      setUnreadCount(data.filter(n => !n.read).length)
    } catch {
      // Session expired or auth error — silently ignore
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [userId])

  async function markAllRead() {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function handleClick(notif: Notification) {
    // Mark as read
    if (!notif.read) {
      const supabase = createClient()
      await supabase.from('notifications').update({ read: true }).eq('id', notif.id)
      setUnreadCount(c => Math.max(0, c - 1))
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
    }

    setOpen(false)

    // Navigate based on type
    if (notif.topic_id) {
      router.push(`/topics/${notif.topic_id}`)
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case 'upvote': return <ThumbsUp className="w-3.5 h-3.5 text-zhihu-blue" />
      case 'reply': return <MessageCircle className="w-3.5 h-3.5 text-green-500" />
      case 'report_resolved': return <Flag className="w-3.5 h-3.5 text-amber-500" />
      default: return <Bell className="w-3.5 h-3.5" />
    }
  }

  function getText(n: Notification): string {
    switch (n.type) {
      case 'upvote': return `${n.from_username} 赞了你的观点`
      case 'reply': return `${n.from_username} 回复了你的观点`
      case 'report_resolved': return '你举报的内容已被处理'
      default: return '新通知'
    }
  }

  function timeAgo(d: string): string {
    const diff = Date.now() - new Date(d).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}小时前`
    return `${Math.floor(hours / 24)}天前`
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications() }}
        className="relative p-1.5 transition-colors hover:bg-gray-100 rounded-md" style={{ color: '#6B7280' }}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-zhihu-red text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-md border border-gray-100 shadow-xl z-50 animate-slide-in max-h-96 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span className="text-sm font-semibold text-gray-900">通知</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-zhihu-blue hover:underline">
                全部已读
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-400">加载中...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">暂无通知</div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-50 ${
                    !n.read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{getText(n)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-zhihu-blue shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
