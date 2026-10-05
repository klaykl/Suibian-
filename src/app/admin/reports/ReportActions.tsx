'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export function ReportActions({ reportId }: { reportId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAction(status: 'resolved' | 'dismissed') {
    setLoading(true)
    const supabase = createClient()

    // Get report to find the reporter
    const { data: report } = await supabase.from('reports').select('reporter_id').eq('id', reportId).single()

    const { error } = await supabase
      .from('reports')
      .update({ status, admin_note: status === 'resolved' ? '已处理' : '不构成违规' })
      .eq('id', reportId)

    if (error) {
      toast.error('操作失败')
    } else {
      // Notify reporter
      if (report) {
        await supabase.from('notifications').insert({
          user_id: report.reporter_id,
          type: 'report_resolved',
          from_user_id: (await supabase.auth.getUser()).data.user?.id,
        })
      }
      toast.success(status === 'resolved' ? '已标记为已处理' : '已驳回举报')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => handleAction('resolved')}
        disabled={loading}
        className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        确认违规
      </button>
      <button
        onClick={() => handleAction('dismissed')}
        disabled={loading}
        className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
      >
        驳回
      </button>
    </div>
  )
}
