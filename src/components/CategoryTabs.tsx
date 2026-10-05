'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useLang } from '@/lib/language'

const TOP_CATEGORIES = ['科技', '职场', '生活', '哲学', '教育', '社会', 'AI', '商业']
const ALL_CATEGORIES = ['科技', '编程', 'AI', '互联网', '数码', '职场', '创业', '管理', '商业', '社会', '生活', '情感', '家庭', '健康', '哲学', '心理', '历史', '文学', '艺术', '教育', '法律', '经济', '环境', '体育', '游戏', '娱乐', '音乐', '电影', '美食', '旅行', '国际', '军事']

export function CategoryTabs({ current }: { current?: string }) {
  const { tSync } = useLang()
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? ALL_CATEGORIES : TOP_CATEGORIES

  return (
    <div className="flex items-center gap-1 mb-5 flex-wrap">
      <Link
        href="/"
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          !current ? 'font-semibold' : ''
        }`}
        style={{ color: !current ? '#1E3A8A' : '#6B7280', backgroundColor: !current ? '#EFF3FF' : 'transparent' }}
      >{tSync('common.all')}</Link>
      {visible.map(c => {
        const active = current === c
        return (
          <Link
            key={c}
            href={`/?cat=${c}`}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              active ? 'font-semibold' : ''
            }`}
            style={{ color: active ? '#1E3A8A' : '#6B7280', backgroundColor: active ? '#EFF3FF' : 'transparent' }}
          >{c}</Link>
        )
      })}
      <button onClick={() => setShowAll(!showAll)}
        className="px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-gray-50 flex items-center gap-0.5"
        style={{ color: '#9CA3AF' }}>
        {showAll ? tSync('common.less') : tSync('common.more')}
        <ChevronDown className={`w-3 h-3 transition-transform ${showAll ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )
}
