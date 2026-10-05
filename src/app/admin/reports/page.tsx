import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Flag } from 'lucide-react'
import { ReportActions } from './ReportActions'

async function getReports() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

async function getReportDetails(reports: any[]) {
  const supabase = await createClient()
  const enriched = []

  for (const r of reports) {
    // Get reporter username
    const { data: reporter } = await supabase.from('profiles').select('username').eq('id', r.reporter_id).single()

    // Get reported content
    let content = ''
    if (r.reported_type === 'comment') {
      const { data: comment } = await supabase.from('comments').select('body').eq('id', r.reported_id).single()
      content = comment?.body?.substring(0, 200) || '(已删除)'
    } else {
      const { data: topic } = await supabase.from('topics').select('title').eq('id', r.reported_id).single()
      content = topic?.title || '(已删除)'
    }

    enriched.push({
      ...r,
      reporter_name: reporter?.username || '匿名',
      content,
    })
  }
  return enriched
}

export default async function AdminReportsPage() {
  await requireAdmin()
  const reports = await getReports()
  const enriched = await getReportDetails(reports)

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />返回首页
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <Flag className="w-5 h-5 text-gray-700" />
        <h1 className="text-xl font-bold text-gray-900">举报管理</h1>
        <span className="text-sm text-gray-400">{enriched.length} 条</span>
      </div>

      {enriched.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-md border border-gray-100">
          <Flag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">暂无举报</p>
        </div>
      ) : (
        <div className="space-y-2">
          {enriched.map((r: any) => (
            <div key={r.id} className="bg-white rounded-md border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      r.reported_type === 'comment' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {r.reported_type === 'comment' ? '评论' : '话题'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      r.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                      r.status === 'resolved' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {r.status === 'pending' ? '待处理' : r.status === 'resolved' ? '已处理' : '已驳回'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mb-1 line-clamp-2">{r.content}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>举报人：{r.reporter_name}</span>
                    <span>原因：{r.reason}</span>
                    <span>{new Date(r.created_at).toLocaleString('zh-CN')}</span>
                  </div>
                  {r.admin_note && (
                    <p className="text-xs text-gray-500 mt-1">管理员备注：{r.admin_note}</p>
                  )}
                </div>
                {r.status === 'pending' && <ReportActions reportId={r.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
