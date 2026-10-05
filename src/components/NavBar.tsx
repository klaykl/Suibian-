'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './NotificationBell'
import { NavUserMenu } from './NavUserMenu'
import { Search, Plus, Globe, Type, ShoppingBag } from 'lucide-react'
import { useLang, LANG_LABELS, LANG_NAMES, type Lang } from '@/lib/language'
import type { User } from '@supabase/supabase-js'
import { CreateTopicModal } from './CreateTopicModal'

export function NavBar() {
  const [user, setUser] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [points, setPoints] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [fontOpen, setFontOpen] = useState(false)
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { lang, setLang, tSync } = useLang()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ?? null)
      if (u) supabase.from('profiles').select('avatar_url, points').eq('id', u.id).single().then(({ data: p }) => {
        setAvatarUrl(p?.avatar_url || null); setPoints(p?.points || 0)
      })
    }).catch(() => {
      // Auth check failed (e.g. network error, project paused) — stay as unauthenticated
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null; setUser(u)
      if (u) supabase.from('profiles').select('avatar_url, points').eq('id', u.id).single().then(({ data: p }) => {
        setAvatarUrl(p?.avatar_url || null); setPoints(p?.points || 0)
      })
      else { setAvatarUrl(null); setPoints(0) }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('fontSize') as 'small' | 'medium' | 'large' | null
    if (saved) { setFontSize(saved); applyFontSize(saved) }
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function applyFontSize(size: string) {
    if (size === 'small') document.documentElement.style.fontSize = '14px'
    else if (size === 'large') document.documentElement.style.fontSize = '18px'
    else document.documentElement.style.fontSize = '16px'
  }
  function selectFontSize(size: 'small' | 'medium' | 'large') {
    setFontSize(size); applyFontSize(size); localStorage.setItem('fontSize', size); setFontOpen(false)
  }
  const langs: Lang[] = ['zh-CN', 'zh-TW', 'en']

  const tabs = [
    { href: '/following', key: 'nav.following' },
    { href: '/', key: 'nav.recommend' },
    { href: '/hot', key: 'nav.hot' },
    { href: '/themes', key: 'nav.themes' },
  ]

  return (
    <>
    <CreateTopicModal open={createOpen} onClose={() => setCreateOpen(false)} />
    <nav className="sticky top-0 z-50 transition-all duration-200"
      style={{
        backgroundColor: scrolled ? 'rgba(255,255,255,0.8)' : '#fff',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'rgba(0,0,0,0.06)' : '#F1F5F9'}`,
      }}>
      <div className="mx-auto px-8 h-14 flex items-center" style={{ maxWidth: '1400px' }}>
        {/* Left group: Logo + Nav + Search */}
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <button onClick={() => { window.scrollTo(0,0); if (pathname === '/') router.refresh(); else router.push('/') }}
            className="text-lg font-extrabold tracking-tight shrink-0" style={{ color: '#2563EB', letterSpacing: '-0.03em' }}>
            随辩
          </button>

          <div className="flex items-center gap-6">
            {tabs.map(t => {
              const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)
              return (
                <Link key={t.href} href={t.href}
                  className="text-[13px] transition-all px-3 py-1.5 rounded-full"
                  style={{
                    color: active ? '#2563EB' : '#64748B',
                    backgroundColor: active ? '#EFF6FF' : 'transparent',
                    fontWeight: active ? 600 : 400,
                  }}>
                  {tSync(t.key)}
                </Link>
              )
            })}
          </div>

          <Link href="/search" className="flex items-center gap-2 px-4 py-1.5 text-[13px] rounded-full transition-all ml-4"
            style={{ backgroundColor: '#F1F5F9', color: '#94A3B8', width: '260px' }}>
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">搜索辩题和观点</span>
          </Link>
        </div>

        {/* Right group: Actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-4">
          {user && (
            <button onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-full transition-all hover:-translate-y-px text-white"
              style={{ backgroundColor: '#2563EB' }}>
              <Plus className="w-3.5 h-3.5" />发起辩题
            </button>
          )}

          <div className="relative">
            <button onClick={() => setFontOpen(!fontOpen)} className="p-1.5 rounded-md transition-colors hover:bg-gray-100 text-xs"
              style={{ color: '#94A3B8' }}>
              <Type className="w-3.5 h-3.5" />
            </button>
            {fontOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100"
                onMouseLeave={() => setFontOpen(false)}>
                {(['small','medium','large'] as const).map(s => (
                  <button key={s} onClick={() => selectFontSize(s)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${fontSize === s ? 'font-bold text-brand' : 'text-gray-600'}`}>
                    {s === 'small' ? '小' : s === 'large' ? '大' : '中'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => setLangOpen(!langOpen)} className="p-1.5 rounded-md transition-colors hover:bg-gray-100 text-xs"
              style={{ color: '#94A3B8' }}>
              <Globe className="w-3.5 h-3.5" />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-100"
                onMouseLeave={() => setLangOpen(false)}>
                {langs.map(l => (
                  <button key={l} onClick={() => { setLang(l); setLangOpen(false) }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${lang === l ? 'font-bold text-brand' : 'text-gray-600'}`}>
                    {LANG_NAMES[l]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/shop" className="p-1.5 rounded-md transition-colors hover:bg-gray-100"
                style={{ color: '#94A3B8' }} title="荣誉馆">
                <ShoppingBag className="w-4 h-4" />
              </Link>
              <NotificationBell userId={user.id} />
              <NavUserMenu user={user} avatarUrl={avatarUrl} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-[13px]" style={{ color: '#64748B' }}>登录</Link>
              <Link href="/register" className="text-[13px] font-bold px-4 py-1.5 rounded-full text-white"
                style={{ backgroundColor: '#2563EB' }}>注册</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
    </>
  )
}
