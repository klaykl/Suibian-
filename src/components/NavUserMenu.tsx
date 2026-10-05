'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Settings, UserIcon, Edit3, Flag, MessageCircle, Gift } from 'lucide-react'
import { useLang } from '@/lib/language'
import toast from 'react-hot-toast'
import type { User } from '@supabase/supabase-js'

export function NavUserMenu({ user, avatarUrl: initialAvatar }: { user: User; avatarUrl: string | null }) {
  const { tSync } = useLang()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(user.user_metadata?.is_admin === true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { setAvatarUrl(initialAvatar) }, [initialAvatar])

  // Check admin status from DB on mount (metadata can be stale)
  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (profile?.is_admin) setIsAdmin(true)
    }
    checkAdmin()
  }, [user.id])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/'); router.refresh()
  }

  const username = user.user_metadata?.username || user.email?.split('@')[0] || '用户'
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm transition-all rounded-lg px-2 py-1 hover:bg-gray-50 hover:shadow-md">
        {avatarUrl ? (
            <img src={avatarUrl} className="w-7 h-7 rounded-full object-cover" alt="" />
          ) : (
            <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
              {username[0].toUpperCase()}
            </span>
          )}
              </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-xl py-1 z-50 animate-slide-in" style={{ boxShadow: '0 10px 25px rgba(15,23,42,0.1), 0 1px 3px rgba(15,23,42,0.06)' }}>
          {/* 头像区 */}
          <div className="px-4 py-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
              ) : (
                <span className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 shrink-0">
                  {username[0].toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{username}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <button onClick={() => { router.push(`/users/${user.id}`); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <UserIcon className="w-4 h-4 text-gray-400" />{tSync('nav.profile')}
          </button>
          <button onClick={() => { router.push('/shop'); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Gift className="w-4 h-4 text-gray-400" />荣誉馆
          </button>
          <button onClick={() => { router.push('/messages'); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <MessageCircle className="w-4 h-4 text-gray-400" />{tSync('nav.messages')}
          </button>
          <button onClick={() => { router.push('/settings'); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Edit3 className="w-4 h-4 text-gray-400" />{tSync('nav.settings')}
          </button>
          {isAdmin && (
            <>
              <button onClick={() => { router.push('/admin/topics'); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <Settings className="w-4 h-4 text-gray-400" />{tSync('nav.admin_topics')}
              </button>
              <button onClick={() => { router.push('/admin/reports'); setOpen(false) }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <Flag className="w-4 h-4 text-gray-400" />{tSync('nav.admin_reports')}
              </button>
            </>
          )}
          <div className="border-t border-[#F1F5F9] mt-1 pt-1">
            <button onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <LogOut className="w-4 h-4 text-gray-400" />{tSync('nav.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
