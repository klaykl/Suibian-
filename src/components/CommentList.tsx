'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThumbsUp, ArrowLeftRight, MessageCircle, Trash2, Reply, X, Star } from 'lucide-react'
import { ReportButton } from './ReportButton'
import { ShareButton } from './ShareButton'
import { TransText } from './TransText'
import { useLang } from '@/lib/language'
import toast from 'react-hot-toast'
import type { Comment } from '@/types'
import type { User } from '@supabase/supabase-js'

interface Props { topicId: string; currentUser: User | null; isAdmin: boolean }
interface CommentWithReplies extends Comment { replies: CommentWithReplies[] }

export function CommentList({ topicId, currentUser, isAdmin }: Props) {
  const [comments, setComments] = useState<CommentWithReplies[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'hot' | 'new'>('hot')
  const [upvotedSet, setUpvotedSet] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const router = useRouter()
  const { tSync } = useLang()

  const fetchComments = useCallback(async () => {
    const supabase = createClient()
    let query = supabase.from('comments').select('*').eq('topic_id', topicId)
    if (sortBy === 'hot') query = query.order('upvote_count', { ascending: false })
    else query = query.order('created_at', { ascending: false })
    const { data: rawComments, error } = await query
    if (error || !rawComments) { setLoading(false); return }

    const userIds = [...new Set(rawComments.map((c: any) => c.user_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', userIds)
    const userMap = new Map<string, any>()
    if (profiles) profiles.forEach((p: any) => userMap.set(p.id, p))

    const { data: changes } = await supabase.from('affiliation_changes').select('user_id').eq('topic_id', topicId).in('user_id', userIds)
    const switchedIds = new Set<string>()
    if (changes) changes.forEach((c: any) => switchedIds.add(c.user_id))

    const enriched: Comment[] = rawComments.map((c: any) => ({
      id: c.id, topic_id: c.topic_id, user_id: c.user_id, parent_id: c.parent_id,
      body: c.body, side_at_time: c.side_at_time, upvote_count: c.upvote_count, created_at: c.created_at,
      username: userMap.get(c.user_id)?.username || '?',
      avatar_url: userMap.get(c.user_id)?.avatar_url || null,
      has_switched: switchedIds.has(c.user_id),
    }))

    const topLevel: CommentWithReplies[] = []
    const replyMap = new Map<string, CommentWithReplies[]>()
    for (const c of enriched) {
      const node: CommentWithReplies = { ...c, replies: [] }
      if (!c.parent_id) topLevel.push(node)
      else { const ex = replyMap.get(c.parent_id) || []; ex.push(node); replyMap.set(c.parent_id, ex) }
    }
    for (const c of topLevel) c.replies = replyMap.get(c.id) || []

    if (currentUser) {
      const own = topLevel.filter(c => c.user_id === currentUser.id)
      const others = topLevel.filter(c => c.user_id !== currentUser.id)
      setComments([...own, ...others])
    } else setComments(topLevel)
    setLoading(false)
  }, [topicId, sortBy, currentUser])

  useEffect(() => { fetchComments() }, [fetchComments])

  useEffect(() => {
    if (!currentUser) return
    (async () => {
      const supabase = createClient()
      const { data } = await supabase.from('upvotes').select('comment_id').eq('user_id', currentUser!.id)
      if (data) setUpvotedSet(new Set(data.map((u: any) => u.comment_id)))
    })()
  }, [currentUser])

  async function handleUpvote(commentId: string, ownerId: string) {
    if (!currentUser) { toast.error('请先登录'); router.push('/login'); return }
    const supabase = createClient()
    const hasUpvoted = upvotedSet.has(commentId)
    const delta = hasUpvoted ? -1 : 1
    setUpvotedSet(p => { const n = new Set(p); hasUpvoted ? n.delete(commentId) : n.add(commentId); return n })
    const upd = (list: CommentWithReplies[]): CommentWithReplies[] =>
      list.map(c => ({ ...c, upvote_count: c.id === commentId ? c.upvote_count + delta : c.upvote_count, replies: upd(c.replies || []) } satisfies CommentWithReplies))
    setComments(upd)
    if (hasUpvoted) {
      await supabase.from('upvotes').delete().eq('user_id', currentUser.id).eq('comment_id', commentId)
    } else {
      const { error } = await supabase.from('upvotes').insert({ user_id: currentUser.id, comment_id: commentId })
      if (error) { setUpvotedSet(p => { const n = new Set(p); n.delete(commentId); return n }); setComments(upd); toast.error('点赞失败') }
      else if (ownerId !== currentUser.id) {
        await supabase.from('notifications').insert({ user_id: ownerId, type: 'upvote', from_user_id: currentUser.id, topic_id: topicId, comment_id: commentId })
      }
    }
  }

  async function handleDelete(commentId: string, ownerId: string) {
    if (!currentUser || (!isAdmin && currentUser.id !== ownerId)) return
    if (!confirm('确定删除？')) return
    const supabase = createClient()
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) toast.error('删除失败')
    else { toast.success('已删除'); setComments(prev => prev.filter(c => c.id !== commentId)) }
  }

  async function handleReply(parentId: string, parentOwnerId: string) {
    if (!currentUser) { toast.error('请先登录'); router.push('/login'); return }
    if (!replyBody.trim()) return
    setReplyLoading(true)
    const supabase = createClient()
    const { data: aff } = await supabase.from('affiliations').select('side').eq('user_id', currentUser.id).eq('topic_id', topicId).maybeSingle()
    if (!aff) { toast.error('请先选择立场'); setReplyLoading(false); return }
    const { error } = await supabase.from('comments').insert({ topic_id: topicId, user_id: currentUser.id, parent_id: parentId, body: replyBody.trim(), side_at_time: aff.side })
    if (error) toast.error('回复失败')
    else {
      if (parentOwnerId !== currentUser.id) await supabase.from('notifications').insert({ user_id: parentOwnerId, type: 'reply', from_user_id: currentUser.id, topic_id: topicId, comment_id: parentId })
      toast.success('回复成功'); setReplyBody(''); setReplyingTo(null); fetchComments()
    }
    setReplyLoading(false)
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '刚刚'
    if (mins < 60) return `${mins}分钟前`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}小时前`
    return `${Math.floor(hrs / 24)}天前`
  }

  const maxUpvotes = Math.max(...comments.map(c => c.upvote_count), 1)

  function renderCard(comment: CommentWithReplies, isReply = false, isTopComment = false) {
    const isOwn = currentUser && comment.user_id === currentUser.id
    const canDelete = isAdmin || isOwn
    const isPro = comment.side_at_time === 'for'

    return (
      <div key={comment.id} className={`${isReply ? 'ml-10' : ''}`}>
        <div className={`py-3 ${isReply ? '' : 'border-t border-border'} group`}>
          <div className="flex gap-3">
            {/* Avatar — bigger */}
            <button onClick={() => router.push(`/users/${comment.user_id}`)} className="shrink-0">
              {comment.avatar_url ? (
                <img src={comment.avatar_url} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
              ) : (
                <span className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                  style={{ backgroundColor: isPro ? '#1E3A8A' : '#6B7280' }}>
                  {(comment.username || '?')[0].toUpperCase()}
                </span>
              )}
            </button>

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-0.5">
                <button onClick={() => router.push(`/users/${comment.user_id}`)}
                  className="text-sm font-semibold hover:text-brand transition-colors" style={{ color: '#111827' }}>
                  {comment.username}
                </button>
                {/* Side badge — colored */}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isPro ? '#EFF3FF' : '#F3F4F6',
                    color: isPro ? '#1E3A8A' : '#6B7280',
                  }}>
                  {isPro ? '正方' : '反方'}
                </span>
                {isTopComment && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                    style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    <Star className="w-2.5 h-2.5" />精华
                  </span>
                )}
                {comment.has_switched && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                    style={{ backgroundColor: '#FEF3C7', color: '#F59E0B' }}>
                    <ArrowLeftRight className="w-2.5 h-2.5" />换过阵营
                  </span>
                )}
                <span className="text-xs ml-auto" style={{ color: '#9CA3AF' }}>{timeAgo(comment.created_at)}</span>
              </div>

              {/* Body */}
              <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isTopComment ? 'font-medium' : ''}`}
                style={{ color: isTopComment ? '#111827' : '#374151' }}>
                <TransText text={comment.body} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 mt-1.5">
                <button onClick={() => handleUpvote(comment.id, comment.user_id)}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                    upvotedSet.has(comment.id) ? 'font-bold' : ''
                  }`}
                  style={{
                    color: upvotedSet.has(comment.id) ? '#1E3A8A' : '#9CA3AF',
                    backgroundColor: upvotedSet.has(comment.id) ? '#EFF3FF' : 'transparent',
                  }}>
                  <ThumbsUp className="w-3 h-3" />
                  {comment.upvote_count > 0 && comment.upvote_count}
                </button>
                {currentUser && (
                  <button onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyBody('') }}
                    className="text-xs px-2 py-1 rounded-md transition-colors" style={{ color: '#9CA3AF' }}>
                    回复
                  </button>
                )}
                <ShareButton url={`/topics/${topicId}?c=${comment.id}`} title="查看这条观点" />
                {!isOwn && currentUser && <ReportButton type="comment" reportedId={comment.id} />}
                {canDelete && (
                  <button onClick={() => handleDelete(comment.id, comment.user_id)}
                    className="text-xs px-2 py-1 rounded-md ml-auto transition-colors hover:text-red-500" style={{ color: '#D1D5DB' }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: '#F8F9FA' }}>
                  <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} placeholder="写下回复..." rows={2}
                    className="w-full text-sm border border-border rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-brand" />
                  <div className="flex justify-end gap-2 mt-1.5">
                    <button onClick={() => setReplyingTo(null)} className="text-xs px-3 py-1 rounded-md" style={{ color: '#6B7280' }}>取消</button>
                    <button onClick={() => handleReply(comment.id, comment.user_id)} disabled={replyLoading || !replyBody.trim()}
                      className="text-xs px-3 py-1 rounded-md text-white font-medium" style={{ backgroundColor: '#1E3A8A' }}>回复</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-10 border-l-2 pl-4" style={{ borderColor: '#F3F4F6' }}>
            {comment.replies.map(r => renderCard(r, true, false))}
          </div>
        )}
      </div>
    )
  }

  if (loading) return <div className="space-y-0">{[1,2,3].map(i => <div key={i} className="py-4 border-t border-border animate-pulse"><div className="flex gap-3"><div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"/><div className="flex-1"><div className="h-4 bg-gray-100 rounded w-24 mb-2"/><div className="h-4 bg-gray-100 rounded w-full"/></div></div></div>)}</div>

  if (comments.length === 0) return (
    <div className="text-center py-12 border-t border-border">
      <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#D1D5DB' }} />
      <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>还没有观点</p>
      <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>成为第一个打破沉默的人</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{comments.length} 条观点</span>
        <div className="flex text-xs bg-gray-100 rounded-md p-0.5">
          <button onClick={() => setSortBy('hot')}
            className={`px-2.5 py-1 rounded transition-colors ${sortBy === 'hot' ? 'bg-white shadow-sm font-medium' : ''}`}
            style={{ color: sortBy === 'hot' ? '#111827' : '#6B7280' }}>最热</button>
          <button onClick={() => setSortBy('new')}
            className={`px-2.5 py-1 rounded transition-colors ${sortBy === 'new' ? 'bg-white shadow-sm font-medium' : ''}`}
            style={{ color: sortBy === 'new' ? '#111827' : '#6B7280' }}>最新</button>
        </div>
      </div>
      <div>
        {comments.map((c, i) => {
          const isTopComment = i === 0 && c.upvote_count >= maxUpvotes && maxUpvotes > 5
          return (
            <div key={c.id}>
              {renderCard(c, false, isTopComment)}
              {c.replies && c.replies.length > 0 && (
                <div className="ml-10 border-l-2 pl-4" style={{ borderColor: '#F3F4F6' }}>
                  {c.replies.map(r => renderCard(r, true, false))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
