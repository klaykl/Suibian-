'use client'

import { useState } from 'react'
import { TopicCard } from './TopicCard'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { TopicWithCounts } from '@/types'

const INITIAL_COUNT = 8

export function TopicList({ topics }: { topics: TopicWithCounts[] }) {
  const [expanded, setExpanded] = useState(false)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const filtered = topics.filter(t => !hiddenIds.has(t.id))
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT)
  const hasMore = filtered.length > INITIAL_COUNT

  return (
    <div className="space-y-3">
      {visible.map(topic => (
        <TopicCard key={topic.id} topic={topic}
          onHide={() => setHiddenIds(prev => new Set(prev).add(topic.id))} />
      ))}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 text-sm text-gray-500 hover:text-zhihu-blue hover:bg-white rounded-xl border border-dashed border-gray-200 transition-colors flex items-center justify-center gap-1.5"
        >
          {expanded ? (
            <><ChevronUp className="w-4 h-4" />收起</>
          ) : (
            <><ChevronDown className="w-4 h-4" />展开全部 {topics.length} 个话题</>
          )}
        </button>
      )}
    </div>
  )
}
