'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Send, UserPlus } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

function MessagesContent() {
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [profileMap, setProfileMap] = useState<Map<string, any>>(new Map())
  const router = useRouter()
  const searchParams = useSearchParams()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const targetId = searchParams.get('to')
    async function init() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/login'); return }
      setUser(u)
      await loadConversations(u.id)
      if (targetId && targetId !== u.id) await startConversationWith(targetId, u.id)
      setLoading(false)
    }
    init()
  }, [])

  async function loadConversations(userId: string) {
    const supabase = createClient()
    const { data: convs } = await supabase
      .from('conversations').select('*').or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    if (convs) {
      // Get partner profiles
      const partnerIds = convs.map((c: any) => c.user1_id === userId ? c.user2_id : c.user1_id)
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', partnerIds)
      const map = new Map()
      if (profiles) profiles.forEach((p: any) => map.set(p.id, p))
      setProfileMap(map)
      setConversations(convs)
    }
  }

  async function loadMessages(convId: string) {
    const supabase = createClient()
    const { data: msgs } = await supabase
      .from('messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true })
    setMessages(msgs || [])
    // Mark read
    if (user) {
      await supabase.from('messages').update({ read: true }).eq('conversation_id', convId).neq('sender_id', user.id)
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function selectConv(conv: any) {
    setActiveConv(conv)
    await loadMessages(conv.id)
  }

  async function sendMessage() {
    if (!body.trim() || !user || !activeConv) return
    const supabase = createClient()

    // Check mutual follow
    const partnerId = activeConv.user1_id === user.id ? activeConv.user2_id : activeConv.user1_id
    const { data: mutualCheck } = await supabase.from('friends')
      .select('*').eq('user_id', partnerId).eq('friend_id', user.id).eq('status', 'accepted').maybeSingle()

    if (!mutualCheck) {
      // Not mutual — count my unreplied messages
      const { data: myMsgs } = await supabase.from('messages')
        .select('id').eq('conversation_id', activeConv.id).eq('sender_id', user.id)
      const { data: theirMsgs } = await supabase.from('messages')
        .select('id').eq('conversation_id', activeConv.id).eq('sender_id', partnerId)

      if ((myMsgs?.length || 0) >= 1 && (theirMsgs?.length || 0) === 0) {
        toast.error('对方未回关，只能发送一条消息。等对方回复后可继续聊天。')
        return
      }
    }

    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConv.id, sender_id: user.id, body: body.trim(),
    })
    if (!error) {
      setBody('')
      await loadMessages(activeConv.id)
      await supabase.from('conversations').update({
        last_message: body.trim(), last_message_at: new Date().toISOString(),
      }).eq('id', activeConv.id)
      await loadConversations(user.id)
    }
  }

  async function startConversationWith(targetId: string, currentUserId?: string) {
    const uid = currentUserId || user?.id
    if (!uid) return

    const supabase = createClient()

    // Check existing
    const { data: existing } = await supabase.from('conversations').select('*')
      .or(`and(user1_id.eq.${uid},user2_id.eq.${targetId}),and(user1_id.eq.${targetId},user2_id.eq.${uid})`).maybeSingle()
    if (existing) {
      setActiveConv(existing)
      await loadMessages(existing.id)
    } else {
      const { data: newConv } = await supabase.from('conversations').insert({
        user1_id: uid, user2_id: targetId,
      }).select().single()
      if (newConv) {
        await loadConversations(uid)
        setActiveConv(newConv)
        setMessages([])
      }
    }
  }

  async function startConversation() {
    const username = prompt('输入对方的用户名：')
    if (!username) return
    const supabase = createClient()
    const { data: profiles } = await supabase.from('profiles').select('id, username').ilike('username', username).limit(1)
    if (!profiles || profiles.length === 0) { toast.error('未找到该用户'); return }
    const partner = profiles[0]
    if (partner.id === user.id) { toast.error('不能和自己聊天'); return }

    // Check existing
    const { data: existing } = await supabase.from('conversations').select('*')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${partner.id}),and(user1_id.eq.${partner.id},user2_id.eq.${user.id})`).maybeSingle()
    if (existing) {
      setActiveConv(existing)
      await loadMessages(existing.id)
    } else {
      const { data: newConv } = await supabase.from('conversations').insert({
        user1_id: user.id, user2_id: partner.id,
      }).select().single()
      if (newConv) {
        await loadConversations(user.id)
        setActiveConv(newConv)
        setMessages([])
      }
    }
  }

  function getPartner(conv: any) {
    const pid = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id
    return profileMap.get(pid) || { username: '未知用户', avatar_url: null }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />返回
      </Link>

      <div className="flex gap-0 bg-white rounded-md border border-gray-100 overflow-hidden" style={{ minHeight: '70vh' }}>
        {/* Conversation list */}
        <div className="w-72 border-r border-gray-100 flex flex-col">
          <div className="p-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">私信</span>
            <button onClick={startConversation} className="text-zhihu-blue hover:bg-blue-50 p-1 rounded transition-colors">
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">暂无对话</p>
            ) : (
              conversations.map((c: any) => {
                const p = getPartner(c)
                return (
                  <button key={c.id} onClick={() => selectConv(c)}
                    className={`w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${activeConv?.id === c.id ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                        {p.username?.[0]?.toUpperCase() || '?'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.username}</p>
                        <p className="text-xs text-gray-400 truncate">{c.last_message || '开始聊天'}</p>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {activeConv ? (
            <>
              <div className="p-3 border-b border-gray-50 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                  {getPartner(activeConv).username?.[0]?.toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-gray-900">{getPartner(activeConv).username}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m: any) => {
                  const isMine = m.sender_id === user?.id
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMine ? 'bg-zhihu-blue text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}>
                        {m.body}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div className="p-3 border-t border-gray-100 flex gap-2">
                <input type="text" value={body} onChange={e => setBody(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="输入消息..." className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-zhihu-blue" />
                <button onClick={sendMessage} disabled={!body.trim()}
                  className="p-2 bg-zhihu-blue text-white rounded-full hover:bg-blue-700 disabled:opacity-40 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              选择一个对话或开始新的聊天
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">加载中...</div>}>
      <MessagesContent />
    </Suspense>
  )
}
