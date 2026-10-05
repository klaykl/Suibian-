'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, MessageCircle } from 'lucide-react'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ topics: any[]; comments: any[] }>({ topics: [], comments: [] })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setSearched(true)

    const supabase = createClient()

    // Search topics
    const { data: topics } = await supabase
      .from('topics').select('*').ilike('title', `%${q}%`).order('created_at', { ascending: false }).limit(20)

    // Search comments
    const { data: comments } = await supabase
      .from('comments').select('*, topics:topic_id(title)').ilike('body', `%${q}%`).order('created_at', { ascending: false }).limit(30)

    // Flatten topics from comments
    const processed = (comments || []).map((c: any) => ({
      ...c,
      topic_title: c.topics?.title || '未知话题',
    }))

    setResults({ topics: topics || [], comments: processed })
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="搜索话题、观点..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-zhihu-blue shadow-sm"
          />
        </div>
      </form>

      {loading && <div className="text-center text-gray-400 py-10">搜索中...</div>}

      {searched && !loading && results.topics.length === 0 && results.comments.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">未找到「{query}」的相关内容</p>
        </div>
      )}

      {/* Results */}
      {results.topics.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">话题</h2>
          <div className="space-y-2">
            {results.topics.map((t: any) => (
              <Link key={t.id} href={`/topics/${t.id}`}
                className="block bg-white rounded-md border border-gray-100 p-4 hover:border-gray-200 transition-colors">
                <h3 className="text-[15px] font-semibold text-gray-900">{t.title}</h3>
                {t.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{t.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.comments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">观点</h2>
          <div className="space-y-2">
            {results.comments.map((c: any) => (
              <Link key={c.id} href={`/topics/${c.topic_id}`}
                className="block bg-white rounded-md border border-gray-100 p-4 hover:border-gray-200 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400">{c.topic_title}</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">{c.body}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
