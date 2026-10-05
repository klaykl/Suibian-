'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowRight, Check } from 'lucide-react'

export function SlideCaptcha({ onVerify }: { onVerify: () => void }) {
  const [verified, setVerified] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)

  const maxOffset = 220 // px to slide

  const handleStart = useCallback((clientX: number) => {
    if (verified) return
    setDragging(true)
    startX.current = clientX - offset
  }, [verified, offset])

  const handleMove = useCallback((clientX: number) => {
    if (!dragging || verified) return
    const newOffset = Math.max(0, Math.min(clientX - startX.current, maxOffset))
    setOffset(newOffset)
    if (newOffset >= maxOffset - 5) {
      setVerified(true)
      setOffset(maxOffset)
      setDragging(false)
      onVerify()
    }
  }, [dragging, verified, maxOffset, onVerify])

  const handleEnd = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    if (!verified) setOffset(0)
  }, [dragging, verified])

  // Mouse events
  useEffect(() => {
    const onMove = (e: MouseEvent) => handleMove(e.clientX)
    const onUp = () => handleEnd()
    if (dragging) {
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, handleMove, handleEnd])

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX)
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX)
  const onTouchEnd = () => handleEnd()

  const progressPct = (offset / maxOffset) * 100

  return (
    <div
      ref={trackRef}
      className="relative h-11 bg-gray-100 rounded-md select-none overflow-hidden border border-gray-200"
      onMouseDown={(e) => handleStart(e.clientX)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Track background fill */}
      <div
        className="absolute inset-y-0 left-0 bg-green-100 rounded-md transition-all duration-100"
        style={{ width: `${progressPct}%` }}
      />

      {/* Track text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-medium transition-colors ${verified ? 'text-green-700' : 'text-gray-400'}`}>
          {verified ? '✓ 验证通过' : '请按住滑块拖动到最右边'}
        </span>
      </div>

      {/* Slider button */}
      <div
        className={`absolute top-0.5 left-0.5 w-10 h-10 rounded-md flex items-center justify-center shadow-sm transition-all duration-75 ${
          verified ? 'bg-green-500' : dragging ? 'bg-zhihu-blue' : 'bg-white border border-gray-200'
        }`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {verified ? (
          <Check className="w-4 h-4 text-white" />
        ) : (
          <ArrowRight className={`w-4 h-4 ${dragging ? 'text-white' : 'text-gray-400'}`} />
        )}
      </div>
    </div>
  )
}
