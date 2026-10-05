'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/language'
import toast from 'react-hot-toast'
import type { Side } from '@/types'

interface Props {
  topicId: string
  currentSide: Side | null
  isLoggedIn: boolean
}

export function AffiliationToggle({ topicId, currentSide, isLoggedIn }: Props) {
  const { tSync } = useLang()
  const [side, setSide] = useState<Side | null>(currentSide)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState<Side | null>(null)
  const router = useRouter()

  async function pickSide(newSide: Side) {
    if (!isLoggedIn) { toast.error('请先登录后再选择立场'); router.push('/login'); return }
    if (side === newSide) return
    if (side && side !== newSide) { setConfirming(newSide); return }
    await submitSide(newSide)
  }

  async function submitSide(newSide: Side) {
    setLoading(true)
    setConfirming(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('请先登录'); router.push('/login'); setLoading(false); return }

    const oldSide = side
    if (oldSide) {
      const { data: affiliation } = await supabase
        .from('affiliations').select('id, changed_at')
        .eq('user_id', user.id).eq('topic_id', topicId).single()

      if (affiliation) {
        if (affiliation.changed_at) {
          const lastChange = new Date(affiliation.changed_at).getTime()
          const cooldownMs = 5 * 60 * 1000
          if (Date.now() - lastChange < cooldownMs) {
            const remaining = Math.ceil((cooldownMs - (Date.now() - lastChange)) / 60000)
            toast.error(`切换太频繁，请 ${remaining} 分钟后再试`)
            setLoading(false); return
          }
        }
        const { error } = await supabase
          .from('affiliations').update({ side: newSide, changed_at: new Date().toISOString() })
          .eq('id', affiliation.id)
        if (error) { toast.error('切换失败'); setLoading(false); return }
        await supabase.from('affiliation_changes').insert({
          affiliation_id: affiliation.id, user_id: user.id, topic_id: topicId,
          from_side: oldSide, to_side: newSide,
        })
      }
    } else {
      const { error } = await supabase.from('affiliations').insert({
        user_id: user.id, topic_id: topicId, side: newSide,
      })
      if (error) { toast.error('操作失败'); setLoading(false); return }
    }
    setSide(newSide)
    toast.success(oldSide ? `立场已切换：${oldSide === 'for' ? '正方 → 反方' : '反方 → 正方'}` : `你选择了${newSide === 'for' ? '正方' : '反方'}`)
    router.refresh()
    setLoading(false)
  }

  const forActive = side === 'for'
  const againstActive = side === 'against'

  return (
    <div className="bg-white rounded-md border border-ivory-dark p-0 overflow-hidden">
      {/* Confirmation dialog */}
      {confirming && (
        <div className="mx-5 mt-5 animate-slide-in">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800 font-medium mb-1">确认切换立场</p>
            <p className="text-sm text-amber-700 mb-3">
              从 <strong>{side === 'for' ? tSync('topic.for') : tSync('topic.against')}</strong> 切换到 <strong>{confirming === 'for' ? tSync('topic.for') : tSync('topic.against')}</strong>？
            </p>
            <div className="flex gap-2">
              <button onClick={() => submitSide(confirming)} disabled={loading}
                className="px-4 py-1.5 bg-amber-600 text-white rounded text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
                {loading ? '切换中...' : '确认'}
              </button>
              <button onClick={() => setConfirming(null)} disabled={loading}
                className="px-4 py-1.5 text-gray-600 hover:text-gray-800 text-sm">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle bar */}
      <div className="flex items-stretch">
        {/* 正方 */}
        <button
          onClick={() => pickSide('for')}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-[15px] font-semibold transition-all ${
            forActive
              ? 'bg-zhihu-blue text-white'
              : 'text-gray-500 hover:text-zhihu-blue hover:bg-blue-50/50'
          } disabled:opacity-50`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${
            forActive ? 'border-white text-white' : 'border-gray-300 text-gray-400'
          }`}>
            {forActive ? '✓' : '?'}
          </span>
          <span suppressHydrationWarning>{tSync('topic.support_for')}</span>
        </button>

        {/* Divider */}
        <div className="w-px bg-gray-100" />

        {/* 反方 */}
        <button
          onClick={() => pickSide('against')}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-[15px] font-semibold transition-all ${
            againstActive
              ? 'bg-zhihu-red text-white'
              : 'text-gray-500 hover:text-zhihu-red hover:bg-red-50/50'
          } disabled:opacity-50`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 ${
            againstActive ? 'border-white text-white' : 'border-gray-300 text-gray-400'
          }`}>
            {againstActive ? '✓' : '?'}
          </span>
          <span suppressHydrationWarning>{tSync('topic.support_against')}</span>
        </button>
      </div>

      {/* Status */}
      {side && (
        <div className="px-5 py-2.5 bg-gray-50 border-t border-ivory-dark flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${forActive ? 'bg-zhihu-blue' : 'bg-zhihu-red'}`} />
          <span className="text-xs text-gray-500">
            {tSync('sidebar.you_are')} <strong className={forActive ? 'text-zhihu-blue' : 'text-zhihu-red'}>
              {forActive ? tSync('topic.for') : tSync('topic.against')}
            </strong>，{tSync('sidebar.hint')}
          </span>
        </div>
      )}
    </div>
  )
}
