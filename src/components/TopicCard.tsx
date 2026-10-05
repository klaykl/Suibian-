'use client'

import Link from 'next/link'
import { Clock, Users, ArrowLeftRight } from 'lucide-react'
import { TransText } from './TransText'
import { TopicMenu } from './TopicMenu'
import { useLang } from '@/lib/language'
import type { TopicWithCounts } from '@/types'

function formatTimeLeft(endsAt: string, closedLabel: string): string {
  const now = Date.now(); const end = new Date(endsAt).getTime(); const diff = end - now
  if (diff <= 0) return closedLabel
  const days = Math.floor(diff / 86400000); const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `剩余 ${days} 天 ${hours} 小时`
  if (hours > 0) return `剩余 ${hours} 小时`
  return '即将结束'
}

export function TopicCard({ topic, onHide }: { topic: TopicWithCounts; onHide?: () => void }) {
  const isActive = topic.status === 'active'
  const total = topic.for_count + topic.against_count
  const totalSwitches = topic.switch_for_to_against + topic.switch_against_to_for
  const forPct = total > 0 ? Math.round((topic.for_count / total) * 100) : 50
  const againstPct = 100 - forPct
  const { tSync } = useLang()
  const category = (topic as any).category || '科技'
  const contentType = (topic as any).content_type || 'debate'
  const options = (topic as any).options as string[] | null
  const diff = Math.abs(topic.for_count - topic.against_count)
  const battleLabel = total > 0 && diff <= Math.max(total * 0.05, 3) ? '胶着' : null

  return (
    <Link
      href={`/topics/${topic.id}`}
      className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group mb-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5"
            style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>{category}</span>
          {contentType === 'advice' && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5"
              style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>💡 求建议</span>
          )}
          {(topic as any).is_anonymous && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5"
              style={{ backgroundColor: '#F1F5F9', color: '#94A3B8' }}>🎭 匿名</span>
          )}
          <h3 className="text-[15px] font-semibold leading-snug group-hover:text-brand transition-colors flex-1" style={{ color: '#111827' }}>
            <TransText text={topic.title} />
          </h3>
          {battleLabel && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
              style={{ backgroundColor: '#FEF3C7', color: '#F59E0B' }}>{battleLabel}</span>
          )}
          <div className="shrink-0 ml-2">
            <TopicMenu topicId={topic.id} category={category || '科技'} onHide={onHide || (() => {})} />
          </div>
        </div>

        {contentType === 'advice' && options && options.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {options.slice(0, 4).map((opt: string, i: number) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>
                {String.fromCharCode(65 + i)}. {opt}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold tabular-nums" style={{ color: '#2563EB' }}>正方 {topic.for_count}</span>
            <div className="h-1.5 rounded-full overflow-hidden flex" style={{ width: '56px', backgroundColor: '#F1F5F9' }}>
              <div className="h-full rounded-full" style={{ width: `${forPct}%`, backgroundColor: '#2563EB' }} />
              <div className="h-full rounded-full" style={{ width: `${againstPct}%`, backgroundColor: '#D1D5DB' }} />
            </div>
            <span className="text-xs font-extrabold tabular-nums" style={{ color: '#D1D5DB' }}>反方 {topic.against_count}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] ml-auto" style={{ color: '#94A3B8' }}>
            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{isActive ? formatTimeLeft(topic.ends_at, tSync('topic.closed')) : tSync('topic.closed')}</span>
            <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{total} 人</span>
            {totalSwitches > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: '#FFF7ED', color: '#D97706' }}><ArrowLeftRight className="w-2.5 h-2.5" />换阵营</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
