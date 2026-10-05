'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TopicCard } from './TopicCard'
import { Loader2 } from 'lucide-react'
import type { TopicWithCounts } from '@/types'

const PAGE_SIZE = 20
const POOL_SIZE = 80   // fetch a large pool so each refresh can draw different topics

// Seeded pseudo-random — same seed → same sequence, different seed → different sequence
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

// Pick K items from list using seeded shuffle — keeps newest KEEP at front
function sampleForRefresh(list: any[], count: number, seed: number): any[] {
  if (list.length <= count) return list
  const rng = seededRandom(seed)
  // Pin only genuinely recent topics (within last 24h) at the front
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const recent = list.filter((t: any) => t.created_at >= oneDayAgo)
  const pool = list.filter((t: any) => t.created_at < oneDayAgo)
  // Fisher-Yates shuffle the pool with seeded RNG
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  // Recent topics first, then sampled from the rest
  const slotsForPool = Math.max(0, count - recent.length)
  return [...recent.slice(0, count), ...pool.slice(0, slotsForPool)]
}

export function TopicFeed({ category, refreshKey }: { category?: string; refreshKey?: number }) {
  const [topics, setTopics] = useState<any[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const loaderRef = useRef<HTMLDivElement>(null)

  async function loadFresh(seed: number) {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_topics_paginated', {
      offset_val: 0,
      limit_val: POOL_SIZE,
      category_filter: category || null,
    })
    if (error || !data || data.length === 0) { setLoading(false); return }
    const enriched = data.map((t: any) => ({
      id: t.id, title: t.title, description: t.description,
      status: t.status, category: t.category || '科技',
      starts_at: t.starts_at, ends_at: t.ends_at,
      final_for_count: 0, final_against_count: 0,
      created_by: '', created_at: t.created_at,
      for_count: Number(t.for_count), against_count: Number(t.against_count),
      total_participants: Number(t.for_count) + Number(t.against_count),
      switch_for_to_against: Number(t.switch_fa),
      switch_against_to_for: Number(t.switch_af),
      top_comment_body: t.top_comment_body || null,
      top_comment_side: t.top_comment_side || null,
      top_comment_username: t.top_comment_username || null,
      content_type: (t as any).content_type || 'debate',
      options: (t as any).options,
      is_anonymous: (t as any).is_anonymous,
    }))

    // Sample PAGE_SIZE topics using seed — different seed → different selection
    const sampled = sampleForRefresh(enriched, PAGE_SIZE, seed)
    setTopics(sampled)
    setOffset(PAGE_SIZE)
    setHasMore(data.length >= PAGE_SIZE)

    // Always show a brief refresh confirmation so the user knows something happened
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 2000)
    setLoading(false)
  }

  // Fetch on mount and when refreshKey changes
  useEffect(() => {
    setTopics([]); setOffset(0); setHasMore(true)
    loadFresh(refreshKey ?? Date.now())
  }, [refreshKey])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_topics_paginated', {
      offset_val: offset,
      limit_val: PAGE_SIZE,
      category_filter: category || null,
    })
    if (error || !data || data.length === 0) { setHasMore(false); setLoading(false); return }
    const enriched = data.map((t: any) => ({
      id: t.id, title: t.title, description: t.description,
      status: t.status, category: t.category || '科技',
      starts_at: t.starts_at, ends_at: t.ends_at,
      final_for_count: 0, final_against_count: 0,
      created_by: '', created_at: t.created_at,
      for_count: Number(t.for_count), against_count: Number(t.against_count),
      total_participants: Number(t.for_count) + Number(t.against_count),
      switch_for_to_against: Number(t.switch_fa),
      switch_against_to_for: Number(t.switch_af),
      top_comment_body: t.top_comment_body || null,
      top_comment_side: t.top_comment_side || null,
      top_comment_username: t.top_comment_username || null,
      content_type: (t as any).content_type || 'debate',
      options: (t as any).options,
      is_anonymous: (t as any).is_anonymous,
    }))
    setTopics(prev => [...prev, ...enriched])
    setOffset(prev => prev + PAGE_SIZE)
    if (data.length < PAGE_SIZE) setHasMore(false)
    setLoading(false)
  }, [offset, loading, hasMore, category])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore) loadMore() },
      { threshold: 0.1 }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  const seenIds = new Set<string>()
  const visible = topics.filter(t => {
    if (hiddenIds.has(t.id)) return false
    if (seenIds.has(t.id)) return false
    seenIds.add(t.id)
    return true
  })

  return (
    <div>
      {isRefreshing && (
        <div className="py-3 text-center text-sm animate-fade-in rounded-lg mb-2"
          style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>
          已重新发现观点
        </div>
      )}
      <div>
        {visible.map(t => (
          <TopicCard key={t.id} topic={t}
            onHide={() => setHiddenIds(prev => new Set(prev).add(t.id))} />
        ))}
      </div>

      <div ref={loaderRef} className="py-8 text-center">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            正在寻找更多观点...
          </div>
        )}
        {!hasMore && visible.length > 0 && (
          <p className="text-sm" style={{ color: '#94A3B8' }}>— 已经到底了 —</p>
        )}
        {!hasMore && visible.length === 0 && (
          <p className="text-sm" style={{ color: '#94A3B8' }}>暂无更多话题</p>
        )}
      </div>
    </div>
  )
}
