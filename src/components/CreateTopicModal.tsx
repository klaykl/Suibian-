'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, Send, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const PRESET_CATEGORIES = [
  '科技', '编程', 'AI', '互联网', '数码',
  '职场', '创业', '管理', '商业',
  '社会', '生活', '情感', '家庭', '健康',
  '哲学', '心理', '历史', '文学', '艺术',
  '教育', '法律', '经济', '环境', '体育',
  '游戏', '娱乐', '音乐', '电影', '美食',
  '旅行', '国际', '军事',
]

const DURATIONS = [
  { label: '1 天', value: 1 },
  { label: '3 天', value: 3 },
  { label: '5 天', value: 5 },
  { label: '7 天', value: 7 },
]

export function CreateTopicModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('科技')
  const [customCategory, setCustomCategory] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [contentType, setContentType] = useState<'debate' | 'advice'>('debate')
  const [adviceOptions, setAdviceOptions] = useState<string[]>(['', ''])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [duration, setDuration] = useState(3)
  const [loading, setLoading] = useState(false)
  const [similarTopics, setSimilarTopics] = useState<any[]>([])
  const [checking, setChecking] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Duplicate detection with keyword extraction + synonym mapping
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (title.trim().length < 3) { setSimilarTopics([]); return }

    debounceRef.current = setTimeout(async () => {
      setChecking(true)

      // --- Keyword Extraction ---
      // Split by punctuation AND by common Chinese bigram boundaries
      const raw = title.trim()
      // Split on punctuation
      const segments = raw.split(/[\s，。？?！!、：:；;（）()「」『』""'’\-—…·]+/).filter(s => s.length >= 2)
      // Also extract 2-4 char bigrams from longer segments
      const words: string[] = []
      const STOP_WORDS = new Set(['吗','呢','吧','啊','的','了','是','不','也','都','就','还','要','会','能','可以','应该','是不是','怎么','为什么','什么','怎样','如何','哪里','哪个','哪些','谁','什么时候','会不会'])
      const QUESTION_PATTERNS = /^(吗|呢|吧|啊|是不是|会不会|怎么|为什么|什么|怎样|如何|哪里|哪个|哪些|谁|什么时候|会不会)$/

      for (const seg of segments) {
        if (seg.length <= 1 || QUESTION_PATTERNS.test(seg) || STOP_WORDS.has(seg)) continue
        words.push(seg)
        // Extract bigrams from longer strings
        if (seg.length >= 4) {
          for (let i = 0; i < seg.length - 1; i++) {
            const bigram = seg.substring(i, i + 2)
            if (!STOP_WORDS.has(bigram) && !QUESTION_PATTERNS.test(bigram)) words.push(bigram)
          }
        }
      }

      // Remove duplicates, take top weighted
      const uniqueWords = [...new Set(words)].slice(0, 8)
      if (uniqueWords.length === 0) { setSimilarTopics([]); setChecking(false); return }

      // --- Synonym Mapping ---
      const SYNONYMS: Record<string, string[]> = {
        'AI': ['AI', '人工智能', '机器'],
        '取代': ['取代', '淘汰', '顶替', '替代'],
        '程序员': ['程序员', '开发者', '工程师', '码农'],
        '大学': ['大学', '高校', '本科'],
        '文凭': ['文凭', '学历', '学位'],
        '远程': ['远程', '居家', '线上', '在家'],
        '办公': ['办公', '工作', '上班'],
        '买房': ['买房', '购房', '置产'],
        '租房': ['租房', '出租', '租住'],
        '教育': ['教育', '教学', '培养'],
        '公平': ['公平', '平等', '公正'],
        '改变': ['改变', '转变', '切换', '更改'],
        '立场': ['立场', '观点', '看法', '态度'],
        '辩论': ['辩论', '讨论', '争议', '争论'],
      }

      // Expand keywords with synonyms
      const expandedWords: string[] = []
      for (const w of uniqueWords) {
        expandedWords.push(w)
        // Check all synonym groups
        for (const [_, syns] of Object.entries(SYNONYMS)) {
          if (syns.some(s => w.includes(s) || s.includes(w))) {
            for (const s of syns) {
              if (!expandedWords.includes(s) && s.length >= 2) expandedWords.push(s)
            }
          }
        }
      }

      // Take top 5 expanded words (most are core concepts)
      const searchWords = [...new Set(expandedWords)].slice(0, 5)

      // Search Supabase
      const supabase = createClient()
      const filterStr = searchWords.map(k => `title.ilike.%${k}%`).join(',')
      const { data } = await supabase.from('topics')
        .select('id, title, category')
        .eq('status', 'active')
        .or(filterStr)
        .limit(8)

      if (data && data.length > 0) {
        // Weighted scoring
        const scored = data.map((t: any) => {
          const titleLower = t.title.toLowerCase()
          let score = 0
          for (const w of searchWords) {
            if (titleLower.includes(w.toLowerCase())) {
              // Core words (3+ chars, likely nouns/verbs) get 2x weight
              const weight = w.length >= 3 && !QUESTION_PATTERNS.test(w) ? 2 : 1
              score += weight
            }
          }
          // Penalize very different length titles
          const lengthDiff = Math.abs(t.title.length - raw.length) / Math.max(t.title.length, raw.length)
          const similarity = score / (searchWords.length * 2) * (1 - lengthDiff * 0.3)
          return { ...t, similarity: Math.min(similarity, 1) }
        }).filter((t: any) => t.similarity >= 0.25).sort((a: any, b: any) => b.similarity - a.similarity)

        setSimilarTopics(scored.slice(0, 4))
      } else {
        setSimilarTopics([])
      }
      setChecking(false)
    }, 500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [title])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const finalCategory = showCustom && customCategory.trim() ? customCategory.trim() : category
    if (!title.trim()) { toast.error('请输入标题'); return }
    if (title.trim().length < 5) { toast.error('标题至少 5 个字'); return }
    if (showCustom && customCategory.trim().length > 8) { toast.error('自定义分类不超过 8 个字'); return }

    // Validate advice options
    let optionsJson = null
    if (contentType === 'advice') {
      const validOptions = adviceOptions.map(o => o.trim()).filter(o => o.length > 0)
      if (validOptions.length < 2) { toast.error('请至少填写 2 个选项'); return }
      if (validOptions.length > 6) { toast.error('最多 6 个选项'); return }
      optionsJson = validOptions
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('请先登录'); setLoading(false); return }

    const startsAt = new Date()
    const endsAt = new Date(startsAt.getTime() + duration * 86400000)

    const { error } = await supabase.from('topics').insert({
      title: title.trim(), description: description.trim() || null,
      category: finalCategory, content_type: contentType,
      options: optionsJson, is_anonymous: isAnonymous,
      starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), created_by: user.id,
    })

    if (error) toast.error('发布失败: ' + error.message)
    else {
      toast.success(contentType === 'debate' ? '辩题发布成功！' : '已发布，等待大家给你建议')
      setTitle(''); setDescription(''); setCategory('科技'); setCustomCategory('')
      setShowCustom(false); setContentType('debate'); setAdviceOptions(['', '']); setIsAnonymous(false); setDuration(3)
      onClose(); router.refresh()
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40 animate-fade-in backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col"
        style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white rounded-t-xl shrink-0 sticky top-0 z-10">
          <h2 className="text-base font-bold text-gray-900">发布新话题</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">话题标题 <span className="text-red-400">*</span></label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="用一句话概括你想讨论的话题，吸引更多人参与..."
              className="w-full text-[15px] bg-white border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-zhihu-blue transition-all placeholder:text-gray-300"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1.5">{title.length}/80 字 · 至少 5 个字</p>

            {/* Similar topics warning */}
            {similarTopics.length > 0 && (
              <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  <span className="text-sm font-bold" style={{ color: '#92400E' }}>已有相似辩题正在热辩中</span>
                </div>
                <div className="space-y-1.5 mb-2">
                  {similarTopics.map((t: any) => (
                    <Link key={t.id} href={`/topics/${t.id}`} onClick={onClose}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-amber-100/50 transition-colors"
                      style={{ backgroundColor: '#fff' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#0F172A' }}>{t.title}</p>
                        <p className="text-[10px]" style={{ color: '#64748B' }}>{t.category} · {t.for_count?.[0]?.count || 0} 人参与</p>
                      </div>
                      <span className="text-xs font-bold flex items-center gap-1 shrink-0 ml-2" style={{ color: '#F59E0B' }}>
                        去对线 <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                </div>
                <p className="text-[10px]" style={{ color: '#92400E' }}>
                  建议直接参与已有辩论，继续创建将消耗 10 说服力
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">背景描述 <span className="text-gray-300 font-normal">— 可选</span></label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="补充一些背景信息，帮助大家更好地理解你的话题..."
              rows={3}
              className="w-full text-sm bg-white border border-gray-200 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-zhihu-blue transition-all placeholder:text-gray-300"
            />
          </div>

          {/* Content type selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">内容类型</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setContentType('debate')}
                className={`flex-1 py-2.5 text-sm rounded-lg border-2 transition-all ${
                  contentType === 'debate' ? 'border-brand bg-brand-light text-brand font-bold' : 'border-gray-200 text-gray-500'
                }`}>
                ⚔️ 发起辩论
              </button>
              <button type="button" onClick={() => setContentType('advice')}
                className={`flex-1 py-2.5 text-sm rounded-lg border-2 transition-all ${
                  contentType === 'advice' ? 'border-brand bg-brand-light text-brand font-bold' : 'border-gray-200 text-gray-500'
                }`}>
                💡 征求意见
              </button>
            </div>
          </div>

          {/* Advice options */}
          {contentType === 'advice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选项（2-6个）</label>
              <div className="space-y-1.5">
                {adviceOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold w-5 text-center shrink-0" style={{ color: '#64748B' }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <input type="text" value={opt} onChange={e => {
                      const next = [...adviceOptions]; next[i] = e.target.value; setAdviceOptions(next)
                    }} placeholder={`选项 ${String.fromCharCode(65 + i)}`}
                      className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand" />
                    {adviceOptions.length > 2 && (
                      <button type="button" onClick={() => setAdviceOptions(adviceOptions.filter((_, j) => j !== i))}
                        className="text-gray-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                    )}
                  </div>
                ))}
              </div>
              {adviceOptions.length < 6 && (
                <button type="button" onClick={() => setAdviceOptions([...adviceOptions, ''])}
                  className="text-xs text-brand hover:underline mt-1.5">+ 添加选项</button>
              )}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
            <div className="flex gap-1.5 flex-wrap max-h-24 overflow-y-auto">
              {PRESET_CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => { setCategory(c); setShowCustom(false) }}
                  className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                    !showCustom && category === c
                      ? 'bg-zhihu-blue text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                  }`}>{c}</button>
              ))}
              <button type="button" onClick={() => setShowCustom(!showCustom)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                  showCustom ? 'bg-zhihu-blue text-white border-zhihu-blue' : 'bg-white text-gray-500 border-dashed border-gray-300 hover:border-gray-400'
                }`}>+ 自定义</button>
            </div>
            {showCustom && (
              <input type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)}
                placeholder="输入分类名（最多8字）" maxLength={8}
                className="mt-2 w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-zhihu-blue" autoFocus />
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">辩论时限</label>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button key={d.value} type="button" onClick={() => setDuration(d.value)}
                  className={`px-4 py-2 text-sm rounded-lg transition-all ${
                    duration === d.value
                      ? 'bg-zhihu-blue text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                  }`}>{d.label}</button>
              ))}
            </div>
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <p className="text-sm font-medium text-gray-700">匿名发布</p>
              <p className="text-xs text-gray-400">别人看不到是你发布的，但你自己能看到数据</p>
            </div>
            <button type="button" onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isAnonymous ? 'bg-brand' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAnonymous ? 'translate-x-5' : ''}`}/>
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100">
              取消
            </button>
            <button type="submit" disabled={loading}
              className="flex-[2] py-2.5 bg-zhihu-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              <Send className="w-4 h-4"/>{loading ? '发布中...' : '发布话题'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
