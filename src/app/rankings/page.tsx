'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Trophy, Crown, Medal } from 'lucide-react'

type Period = 'week' | 'month' | 'year'

export default function RankingsPage() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialPeriod = (params?.get('period') as Period) || 'week'
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [rankings, setRankings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const now = new Date()
      let start: Date; let end: Date
      if (period === 'week') {
        const dayOfWeek = now.getDay()
        start = new Date(now); start.setDate(now.getDate() - dayOfWeek - 6)
        end = new Date(now); end.setDate(now.getDate() - dayOfWeek)
      } else if (period === 'month') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
      } else {
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 11, 31)
      }

      const { data } = await supabase.rpc('get_period_rankings', {
        period_start: start.toISOString(),
        period_end: end.toISOString(),
        limit_count: 10,
      })
      setRankings(data || [])
      setLoading(false)
    }
    load()
    const timer = setInterval(load, 30 * 60 * 1000) // refresh every 30 min
    return () => clearInterval(timer)
  }, [period])

  const periods: { key: Period; label: string; icon: any }[] = [
    { key: 'week', label: '本周', icon: Trophy },
    { key: 'month', label: '本月', icon: Crown },
    { key: 'year', label: '年度', icon: Medal },
  ]

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6">
        <ArrowLeft className="w-3.5 h-3.5"/>返回
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">排行榜</h1>

      {/* Period tabs */}
      <div className="flex gap-2 mb-6">
        {periods.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              period === p.key ? 'bg-zhihu-blue text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}>
            <p.icon className="w-4 h-4"/>{p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">加载中...</div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-10 text-gray-400">暂无数据</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {rankings.map((u: any, i: number) => (
            <Link key={u.user_id} href={`/users/${u.user_id}`}
              className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors ${i < rankings.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                i === 0 ? 'bg-amber-400 text-amber-900' :
                i === 1 ? 'bg-gray-300 text-gray-700' :
                i === 2 ? 'bg-amber-700 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>{i + 1}</span>
              {u.avatar_url ? <img src={u.avatar_url} className="w-10 h-10 rounded-full" alt="" /> :
                <span className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">{(u.username||'?')[0].toUpperCase()}</span>}
              <span className="text-sm font-semibold text-gray-800 flex-1">{u.username}</span>
              <span className="text-sm text-zhihu-blue font-bold">{u.score} 👍</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
