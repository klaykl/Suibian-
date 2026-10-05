'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Side } from '@/types'

export function SidePicker({ topicId, currentSide, isLoggedIn, forCount, againstCount }: {
  topicId: string; currentSide: Side | null; isLoggedIn: boolean
  forCount: number; againstCount: number
}) {
  const [side, setSide] = useState<Side | null>(currentSide)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState<Side | null>(null)
  const router = useRouter()

  async function pickSide(newSide: Side) {
    if (!isLoggedIn) { toast.error('请先登录'); router.push('/login'); return }
    if (side === newSide) return
    if (side && side !== newSide) { setConfirming(newSide); return }
    await submitSide(newSide)
  }

  async function submitSide(newSide: Side) {
    setLoading(true); setConfirming(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('请先登录'); setLoading(false); return }

    if (side) {
      const { data: aff } = await supabase.from('affiliations').select('id, changed_at').eq('user_id', user.id).eq('topic_id', topicId).single()
      if (aff) {
        if (aff.changed_at) {
          const last = new Date(aff.changed_at).getTime()
          if (Date.now() - last < 5 * 60000) { toast.error('切换太频繁，请5分钟后再试'); setLoading(false); return }
        }
        await supabase.from('affiliations').update({ side: newSide, changed_at: new Date().toISOString() }).eq('id', aff.id)
        await supabase.from('affiliation_changes').insert({
          affiliation_id: aff.id, user_id: user.id, topic_id: topicId,
          from_side: side, to_side: newSide,
        })
      }
    } else {
      await supabase.from('affiliations').insert({ user_id: user.id, topic_id: topicId, side: newSide })
    }
    setSide(newSide)
    toast.success(side ? '立场已改变' : `已加入${newSide === 'for' ? '正方' : '反方'}`)
    router.refresh(); setLoading(false)
  }

  const forActive = side === 'for'
  const againstActive = side === 'against'

  return (
    <div>
      {confirming && (
        <div className="mb-2 p-3 rounded-lg animate-fade-in" style={{ backgroundColor: '#FEF3C7' }}>
          <p className="text-sm font-medium" style={{ color: '#92400E' }}>
            确定从 <strong>{side === 'for' ? '正方' : '反方'}</strong> 转为 <strong>{confirming === 'for' ? '正方' : '反方'}</strong>？
          </p>
          <div className="flex gap-2 mt-2">
            <button onClick={() => submitSide(confirming)} disabled={loading}
              className="px-4 py-1.5 text-sm font-bold rounded-md text-white" style={{ backgroundColor: '#F59E0B' }}>
              确认改变立场
            </button>
            <button onClick={() => setConfirming(null)}
              className="px-4 py-1.5 text-sm rounded-md" style={{ color: '#64748B' }}>取消</button>
          </div>
        </div>
      )}

      <div className="flex items-stretch gap-0 rounded-lg overflow-hidden border shadow-subtle bg-white" style={{ borderColor: '#E2E8F0' }}>
        <button onClick={() => pickSide('for')} disabled={loading}
          className="flex-1 py-3 text-center transition-all rounded-lg border-2"
          style={{ backgroundColor: forActive ? '#EFF6FF' : 'transparent', borderColor: forActive ? '#BFDBFE' : '#2563EB' }}>
          <span className="text-sm font-bold" style={{ color: forActive ? '#2563EB' : '#2563EB' }}>
            {forActive ? '✓ 正方' : '加入正方'}
          </span>
          <p className="text-xs mt-0.5" style={{ color: forActive ? '#2563EB' : '#64748B' }}>已有 {forCount} 人</p>
        </button>
        <div className="w-2" />
        <button onClick={() => pickSide('against')} disabled={loading}
          className="flex-1 py-3 text-center transition-all rounded-lg border-2"
          style={{ backgroundColor: againstActive ? '#F1F5F9' : 'transparent', borderColor: againstActive ? '#E2E8F0' : '#E2E8F0' }}>
          <span className="text-sm font-bold" style={{ color: againstActive ? '#475569' : '#64748B' }}>
            {againstActive ? '✓ 反方' : '加入反方'}
          </span>
          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>已有 {againstCount} 人</p>
        </button>
      </div>
      {side && (
        <div className="flex items-center justify-center gap-2 mt-2 px-4 py-2 rounded-lg border" style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
          <span className="text-sm font-bold" style={{ color: '#2563EB' }}>✓ 你支持{forActive ? '正方' : '反方'}</span>
          <span className="text-xs mx-2" style={{ color: '#94A3B8' }}>|</span>
          <button onClick={() => pickSide(forActive ? 'against' : 'for')} disabled={loading}
            className="text-xs font-medium hover:underline" style={{ color: '#F59E0B' }}>改变立场</button>
        </div>
      )}
    </div>
  )
}
