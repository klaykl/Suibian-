'use client'

import { useState } from 'react'
import { Share2, Link, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const fullUrl = `${window.location.origin}${url}`

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl })
        return
      } catch {}
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast.success('链接已复制，发给朋友吧')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-md text-gray-400 hover:text-zhihu-blue hover:bg-blue-50 transition-colors"
      title="转发给朋友"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
    </button>
  )
}
