'use client'

import { useState, useEffect } from 'react'
import { useLang } from '@/lib/language'

export function TransText({ text, className }: { text: string; className?: string }) {
  const { lang, t } = useLang()
  const [translated, setTranslated] = useState(text)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (lang === 'zh-CN') { setTranslated(text); return }
    setLoading(true)
    t(text).then(result => { setTranslated(result); setLoading(false) })
  }, [text, lang, t])

  if (loading && lang !== 'zh-CN') {
    return <span className={className}>{text} <span className="text-gray-300 text-xs">(translating...)</span></span>
  }

  return <span className={className}>{translated}</span>
}
