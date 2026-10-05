'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, EyeOff, ThumbsDown, Flag, X, Undo2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function TopicMenu({ topicId, category, onHide }: {
  topicId: string; category: string; onHide: () => void
}) {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleAction(action: string) {
    setOpen(false)

    if (action === 'not_interested') {
      setHidden(true)
      const toastId = toast('已减少类似内容推荐', {
        icon: '👁️',
        duration: 5000,
        style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '13px' },
      })
      // Give time for the user to see the card hide, then undo if they want
      setTimeout(() => {
        if (hidden) onHide()
      }, 300)
    } else if (action === 'reduce') {
      toast.success(`已减少「${category}」类推荐`)
      setOpen(false)
    } else if (action === 'block') {
      setHidden(true)
      setTimeout(() => onHide(), 300)
      toast.success('已屏蔽该话题')
    }
  }

  if (hidden) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open) }}
        className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
        style={{ color: '#94A3B8' }}>
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50"
          onClick={e => e.stopPropagation()}>
          <button onClick={() => handleAction('not_interested')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
            style={{ color: '#64748B' }}>
            <ThumbsDown className="w-3.5 h-3.5" />不感兴趣
          </button>
          <button onClick={() => handleAction('reduce')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
            style={{ color: '#64748B' }}>
            <EyeOff className="w-3.5 h-3.5" />减少此类推荐
          </button>
          <button onClick={() => handleAction('block')}
            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
            style={{ color: '#64748B' }}>
            <X className="w-3.5 h-3.5" />屏蔽该话题
          </button>
        </div>
      )}
    </div>
  )
}
