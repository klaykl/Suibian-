'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Crown, Star, Zap, ShoppingBag, Check, Target } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const RARITY_MAP: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  '普通': { label: '普通', color: '#94A3B8', bg: '#F1F5F9', dot: '⚪' },
  '稀有': { label: '稀有', color: '#2563EB', bg: '#EFF6FF', dot: '🔵' },
  '史诗': { label: '史诗', color: '#7C3AED', bg: '#F5F3FF', dot: '🟣' },
  '传说': { label: '传说', color: '#F59E0B', bg: '#FEF3C7', dot: '🟠' },
  '限定': { label: '限定', color: '#EC4899', bg: '#FDF2F8', dot: '🩷' },
}

function getRarityInfo(price: number): typeof RARITY_MAP['普通'] {
  if (price <= 100) return RARITY_MAP['普通']
  if (price <= 200) return RARITY_MAP['稀有']
  if (price <= 400) return RARITY_MAP['史诗']
  if (price <= 800) return RARITY_MAP['传说']
  return RARITY_MAP['限定']
}

const DAILY_MISSIONS = [
  { icon: '👍', goal: '获得 10 个点赞', reward: 20, action: 'likes' },
  { icon: '💬', goal: '发表 3 条观点', reward: 15, action: 'comments' },
  { icon: '↔️', goal: '成功说服 1 人', reward: 50, action: 'convince' },
]

const HIDDEN_ITEMS = [
  { name: '??????', desc: '连续 3 次改变立场后解锁', price: 0 },
  { name: '??????', desc: '被 5 个人成功说服后解锁', price: 0 },
]

export default function ShopPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [purchases, setPurchases] = useState<Set<string>>(new Set())
  const [category, setCategory] = useState('all')
  const [previewItem, setPreviewItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/login'); return }
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('points, avatar_frame, title').eq('id', u.id).single()
      setProfile(p)
      const { data: all } = await supabase.from('shop_items').select('*').order('price')
      setItems(all || [])
      const { data: bought } = await supabase.from('purchases').select('item_id').eq('user_id', u.id)
      if (bought) setPurchases(new Set(bought.map((b: any) => b.item_id)))
      setLoading(false)
    }
    load()
  }, [])

  async function buyItem(item: any) {
    if (!profile || profile.points < item.price) { toast.error('说服力不足'); return }
    if (!confirm(`花费 ${item.price} 说服力兑换「${item.name}」？`)) return
    const supabase = createClient()
    const { error } = await supabase.from('purchases').insert({ user_id: user.id, item_id: item.id })
    if (error) { toast.error('兑换失败'); return }
    await supabase.from('profiles').update({ points: profile.points - item.price }).eq('id', user.id)
    setPurchases(prev => new Set(prev).add(item.id))
    setProfile({ ...profile, points: profile.points - item.price })
    toast.success('兑换成功！')
  }

  async function equipItem(item: any) {
    const supabase = createClient()
    if (item.type === 'frame') {
      await supabase.from('profiles').update({ avatar_frame: item.image_class }).eq('id', user.id)
      setProfile({ ...profile, avatar_frame: item.image_class })
    } else {
      await supabase.from('profiles').update({ title: item.name }).eq('id', user.id)
      setProfile({ ...profile, title: item.name })
    }
    toast.success(`已装备「${item.name}」`)
  }

  const cats = ['all', 'frame', 'title']
  const catLabels: Record<string, string> = { all: '全部', frame: '头像框', title: '称号' }
  const filtered = category === 'all' ? items : items.filter(i => i.type === category)

  // Next affordable
  const nextItem = items.filter(i => !purchases.has(i.id) && i.price > (profile?.points || 0)).sort((a,b) => a.price - b.price)[0]

  // Collection stats
  const totalItems = items.length
  const collected = purchases.size
  const collectionPct = totalItems > 0 ? Math.round((collected / totalItems) * 100) : 0

  if (loading) return <div className="text-center py-20" style={{ color: '#94A3B8' }}>加载中...</div>

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: '#94A3B8' }}>
        <ArrowLeft className="w-3.5 h-3.5" />返回
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#0F172A' }}>
            <ShoppingBag className="w-6 h-6" style={{ color: '#F59E0B' }} />荣誉馆
          </h1>
        </div>
        <div className="text-right">
          <span className="text-lg font-extrabold px-4 py-2 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
            ⭐ {profile?.points || 0} 说服力
          </span>
          {nextItem && (
            <p className="text-[10px] mt-1" style={{ color: '#94A3B8' }}>
              距下一件还差 <span className="font-bold" style={{ color: '#F59E0B' }}>{nextItem.price - (profile?.points || 0)}</span> 说服力
            </p>
          )}
        </div>
      </div>

      {/* Collection book */}
      <div className="mb-5 p-5 rounded-xl border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📚</span>
          <span className="text-sm font-bold" style={{ color: '#0F172A' }}>辩者收藏册</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
            已收集 {collected}/{totalItems}
          </span>
        </div>
        {/* Big progress bar */}
        <div className="h-3 rounded-full mb-2" style={{ backgroundColor: '#E2E8F0' }}>
          <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
            style={{ width: `${collectionPct}%`, backgroundColor: '#F59E0B', minWidth: collectionPct > 0 ? '24px' : '0' }}>
            {collectionPct >= 15 && <span className="text-[9px] font-bold text-white">{collectionPct}%</span>}
          </div>
        </div>
        {/* Rarity dots */}
        <div className="flex gap-3 text-xs">
          {Object.entries(RARITY_MAP).map(([key, r]) => {
            const rareItems = items.filter(i => getRarityInfo(i.price).label === key)
            const owned = rareItems.filter(i => purchases.has(i.id)).length
            return (
              <span key={key} className="flex items-center gap-1">
                <span>{r.dot}</span>
                <span style={{ color: '#64748B' }}>{owned}/{rareItems.length}</span>
              </span>
            )
          })}
        </div>
      </div>

      {/* Daily missions + Featured row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {/* Daily missions */}
        <div className="col-span-1 p-4 rounded-xl border" style={{ borderColor: '#E2E8F0', backgroundColor: '#fff' }}>
          <div className="flex items-center gap-1.5 mb-3">
            <Target className="w-4 h-4" style={{ color: '#F59E0B' }} />
            <span className="text-sm font-bold" style={{ color: '#0F172A' }}>今日目标</span>
          </div>
          <div className="space-y-2">
            {DAILY_MISSIONS.map(m => (
              <div key={m.action} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                <span className="text-lg">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: '#0F172A' }}>{m.goal}</p>
                </div>
                <span className="text-xs font-bold shrink-0 px-1.5 py-0.5 rounded" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>+{m.reward}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Featured item */}
        <div className="col-span-2 p-5 rounded-xl border flex items-center gap-5" style={{ borderColor: '#F59E0B30', backgroundColor: '#FFFDF5' }}>
          {(() => {
            const featured = items.find(i => i.price >= 500 && !purchases.has(i.id)) || items[items.length - 1]
            if (!featured) return null
            const r = getRarityInfo(featured.price)
            return (
              <>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0" style={{ backgroundColor: r.color }}>
                  🏆
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block" style={{ color: r.color, backgroundColor: r.color + '20' }}>
                    {r.dot} {r.label} · 本周推荐
                  </span>
                  <h3 className="text-lg font-bold mt-1" style={{ color: '#0F172A' }}>{featured.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{featured.description} · 全站仅 12 人拥有</p>
                  <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>已兑换 37 次</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-extrabold" style={{ color: r.color }}>{featured.price}</p>
                  <p className="text-xs" style={{ color: '#64748B' }}>说服力</p>
                  {purchases.has(featured.id) ? (
                    <button onClick={() => equipItem(featured)} className="mt-2 px-4 py-1.5 text-xs font-bold rounded-md text-white" style={{ backgroundColor: '#2563EB' }}>装备</button>
                  ) : (
                    <button onClick={() => buyItem(featured)} disabled={profile?.points < featured.price}
                      className="mt-2 px-4 py-1.5 text-xs font-bold rounded-md text-white disabled:opacity-40"
                      style={{ backgroundColor: profile?.points >= featured.price ? r.color : '#94A3B8' }}>兑换</button>
                  )}
                </div>
              </>
            )
          })()}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-4">
        {cats.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${category === c ? 'font-bold' : ''}`}
            style={{ color: category === c ? '#2563EB' : '#64748B', backgroundColor: category === c ? '#EFF6FF' : 'transparent' }}>
            {catLabels[c]}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {filtered.map(item => {
          const owned = purchases.has(item.id)
          const equipped = item.type === 'frame' ? profile?.avatar_frame === item.image_class : profile?.title === item.name
          const r = getRarityInfo(item.price)
          return (
            <div key={item.id} onClick={() => setPreviewItem(item)}
              className="bg-white rounded-xl p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg border cursor-pointer group"
              style={{ borderColor: equipped ? r.color : '#F1F5F9' }}>
              <div className="w-14 h-14 rounded-2xl mx-auto mb-2 flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: r.bg }}>
                {item.type === 'frame' ? (
                  <div className="w-11 h-11 rounded-full border-2 flex items-center justify-center text-sm font-bold"
                    style={{ borderColor: r.color, color: r.color }}>D</div>
                ) : <span>🏅</span>}
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1 inline-block"
                style={{ color: r.color, backgroundColor: r.color + '15' }}>{r.dot} {r.label}</span>
              <h3 className="text-sm font-bold mt-1" style={{ color: '#0F172A' }}>{item.name}</h3>
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#94A3B8' }}>{item.description}</p>
              <p className="text-sm font-extrabold mt-2" style={{ color: r.color }}>{item.price} 说服力</p>
              {equipped ? (
                <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>
                  <Check className="w-3 h-3 inline mr-0.5" />使用中
                </span>
              ) : owned ? (
                <button onClick={(e) => { e.stopPropagation(); equipItem(item) }} className="mt-2 w-full py-1.5 text-xs font-bold rounded-md text-white"
                  style={{ backgroundColor: '#2563EB' }}>装备</button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); buyItem(item) }} disabled={profile?.points < item.price}
                  className="mt-2 w-full py-1.5 text-xs font-bold rounded-md transition-colors disabled:opacity-30"
                  style={{ backgroundColor: profile?.points >= item.price ? r.color : '#F1F5F9', color: profile?.points >= item.price ? '#fff' : '#94A3B8' }}>
                  {profile?.points >= item.price ? '兑换' : '不足'}
                </button>
              )}
            </div>
          )
        })}
        {/* Hidden items */}
        {category === 'all' && HIDDEN_ITEMS.map((h, i) => (
          <div key={`hidden-${i}`} className="bg-white rounded-xl p-4 text-center border border-dashed opacity-60"
            style={{ borderColor: '#D1D5DB' }}>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-2 flex items-center justify-center text-2xl"
              style={{ backgroundColor: '#F1F5F9' }}>
              <span style={{ color: '#D1D5DB' }}>❓</span>
            </div>
            <h3 className="text-sm font-bold" style={{ color: '#94A3B8' }}>{h.name}</h3>
            <p className="text-[10px] mt-1 line-clamp-1" style={{ color: '#D1D5DB' }}>{h.desc}</p>
            <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#F1F5F9', color: '#94A3B8' }}>
              🔒 未解锁
            </span>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewItem && (() => {
        const r = getRarityInfo(previewItem.price)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in" onClick={() => setPreviewItem(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 text-center" style={{ backgroundColor: r.bg }}>
                <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl shadow-lg"
                  style={{ backgroundColor: r.color, border: '4px solid white' }}>
                  {previewItem.type === 'frame' ? 'D' : '🏅'}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-3 inline-block"
                  style={{ color: r.color, backgroundColor: r.color + '20' }}>{r.dot} {r.label}</span>
                <h2 className="text-xl font-bold mt-2" style={{ color: '#0F172A' }}>{previewItem.name}</h2>
                <p className="text-sm mt-1" style={{ color: '#64748B' }}>{previewItem.description}</p>
                <p className="text-3xl font-extrabold mt-3" style={{ color: r.color }}>{previewItem.price} <span className="text-sm">说服力</span></p>
              </div>
              <div className="p-4 flex gap-2">
                <button onClick={() => setPreviewItem(null)} className="flex-1 py-2 text-sm rounded-lg font-medium"
                  style={{ color: '#64748B', backgroundColor: '#F1F5F9' }}>关闭</button>
                {purchases.has(previewItem.id) ? (
                  <button onClick={() => { equipItem(previewItem); setPreviewItem(null) }}
                    className="flex-1 py-2 text-sm rounded-lg font-bold text-white" style={{ backgroundColor: '#2563EB' }}>装备</button>
                ) : (
                  <button onClick={() => { buyItem(previewItem); setPreviewItem(null) }}
                    disabled={profile?.points < previewItem.price}
                    className="flex-1 py-2 text-sm rounded-lg font-bold text-white disabled:opacity-40"
                    style={{ backgroundColor: profile?.points >= previewItem.price ? r.color : '#94A3B8' }}>
                    {profile?.points >= previewItem.price ? '立即兑换' : '说服力不足'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
