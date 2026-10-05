'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flag, X } from 'lucide-react'
import { useLang } from '@/lib/language'
import toast from 'react-hot-toast'

const REPORT_REASONS = [
  '垃圾广告',
  '人身攻击或辱骂',
  '恶意灌水',
  '与话题无关',
  '虚假信息',
  '其他',
]

export function ReportButton({ type, reportedId }: { type: 'comment' | 'topic'; reportedId: string }) {
  const { tSync } = useLang()
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const finalReason = reason === '其他' ? customReason.trim() : reason
    if (!finalReason) { toast.error('请选择或填写举报原因'); return }
    if (finalReason.length > 500) { toast.error('原因不能超过500字'); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('请先登录'); setLoading(false); return }

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_type: type,
      reported_id: reportedId,
      reason: finalReason,
    })

    if (error) {
      if (error.message.includes('duplicate')) {
        toast.error('你已经举报过此项内容')
      } else {
        toast.error('举报失败: ' + error.message)
      }
    } else {
      toast.success('举报已提交，我们会尽快处理')
      setShowModal(false)
      setReason('')
      setCustomReason('')
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="举报"
      >
        <Flag className="w-3.5 h-3.5" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-md shadow-xl w-full max-w-md mx-4 p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-900">{tSync('report.title')}{type==='comment'?'评论':'话题'}</span>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {REPORT_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-3 py-2 text-sm rounded border transition-colors ${
                    reason === r
                      ? 'border-zhihu-blue bg-blue-50 text-zhihu-blue font-medium'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {reason === '其他' && (
              <textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="请描述具体原因..."
                rows={3}
                maxLength={500}
                className="w-full border border-gray-200 rounded-md p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-zhihu-blue mb-4"
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !reason}
              className="w-full py-2 bg-zhihu-red text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '提交中...' : '提交举报'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
