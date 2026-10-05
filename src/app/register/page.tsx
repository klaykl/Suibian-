'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Check, ArrowRight, MessageCircle, HelpCircle, RefreshCw } from 'lucide-react'

const INTEREST_OPTIONS = ['科技','编程','AI','互联网','数码','职场','创业','管理','商业','社会','生活','情感','家庭','健康','哲学','心理','历史','文学','艺术','教育','法律','经济','环境','体育','游戏','娱乐','音乐','电影','美食','旅行','国际','军事']

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null)
  const [showInterests, setShowInterests] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('step') === 'interests') {
      setShowInterests(true)
    }
  }, [])
  const router = useRouter()

  useEffect(() => {
    if (username.trim().length < 2) { setUsernameValid(null); return }
    const timer = setTimeout(async () => {
      setChecking(true)
      const supabase = createClient()
      const { data } = await supabase.from('profiles').select('id').ilike('username', username.trim()).maybeSingle()
      setUsernameValid(data ? false : true)
      setChecking(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [username])

  async function handleRegister() {
    if (!username.trim() || username.trim().length < 2 || username.trim().length > 20) {
      toast.error('请先输入用户名'); setShowInterests(false); return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // If user already exists (registered in previous step), just update interests
    if (user) {
      await supabase.from('profiles').update({
        interests: JSON.stringify(selectedInterests),
      }).eq('id', user.id)
      router.push('/onboarding/experience')
      return
    }

    // Otherwise create new user
    const tempEmail = `u_${Date.now()}@suibian.temp`
    const tempPwd = `P_${Math.random().toString(36).slice(2)}_${Date.now()}`
    const { data, error } = await supabase.auth.signUp({
      email: tempEmail, password: tempPwd,
      options: { data: { username: username.trim() } },
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    const userId = data.user?.id
    if (userId) {
      let uid = Math.floor(1000000000 + Math.random() * 9000000000)
      const { data: dup } = await supabase.from('profiles').select('id').eq('uid', uid).maybeSingle()
      if (dup) uid = Math.floor(1000000000 + Math.random() * 9000000000)
      await supabase.from('profiles').update({
        uid, username: username.trim(),
        interests: JSON.stringify(selectedInterests),
      }).eq('id', userId)
    }
    router.push('/onboarding/experience')
  }

  function toggleInterest(i: string) {
    setSelectedInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 8 ? [...prev, i] : prev)
  }

  return (
    <div className="min-h-screen flex items-center">
      {/* Left: Brand — 48% */}
      <div className="hidden lg:flex items-center justify-end" style={{ width: '48%', height: '100vh', background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,.12), transparent 40%), linear-gradient(135deg, #1D4ED8, #2563EB, #4338CA)' }}>
        <div className="max-w-md pr-8" style={{ width: '460px' }}>
          <h1 className="text-[72px] font-extrabold text-white mb-4 tracking-tight" style={{ letterSpacing: '-2px', lineHeight: '1' }}>随辩</h1>
          <p className="text-lg text-blue-200/80 mb-12" style={{ letterSpacing: '0.06em' }}>随辩说 · 随辩问 · 随辩改</p>

          <div className="space-y-6">
            {[
              { icon: MessageCircle, title: '随辩说', desc: '表达自己的观点，参与任何话题的辩论' },
              { icon: HelpCircle, title: '随辩问', desc: '向社区寻求建议，听到不同的声音' },
              { icon: RefreshCw, title: '随辩改', desc: '随时改变自己的立场和想法' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <item.icon className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-[22px] font-bold text-white mb-0.5 leading-tight">{item.title}</p>
                  <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form — 52% */}
      <div className="flex-1 flex items-center justify-center px-6" style={{ width: '52%', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FBFF 100%)' }}>
        <div className="w-full" style={{ maxWidth: '500px' }}>
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-2" style={{ color: '#2563EB' }}>随辩</h1>
            <p className="text-sm" style={{ color: '#64748B' }}>随辩说 · 随辩问 · 随辩改</p>
          </div>

          <div className="bg-white rounded-3xl p-12" style={{ boxShadow: '0 8px 32px rgba(15,23,42,.08)', border: '1px solid #E7EFFF' }}>
            {!showInterests ? (
              <>
                <label className="block mb-3" style={{ fontSize: '36px', fontWeight: 700, color: '#0F172A', lineHeight: '1.2', letterSpacing: '-0.5px', fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "MiSans", "Noto Sans SC", "Microsoft YaHei", sans-serif' }}>你的第一个观点，<br/>从名字开始。</label>
                <p className="text-[15px] mb-6 leading-relaxed" style={{ color: '#64748B' }}>取个昵称，开始表达。</p>

                <div className="relative mb-3">
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="例如：理性派、夜行者、反方律师" minLength={2} maxLength={20} autoFocus
                    className="w-full text-base py-3.5 px-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all placeholder:text-gray-400"
                    style={{ height: 56, border: '1.5px solid #E2E8F0' }} />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {checking && <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />}
                    {usernameValid === true && <Check className="w-5 h-5 text-green-500" />}
                  </div>
                </div>
                {usernameValid === false && <p className="text-xs text-red-500 mb-4 -mt-2 ml-1">该名字已被使用</p>}
                {usernameValid === true && <p className="text-xs text-green-500 mb-4 -mt-2 ml-1">✓ 可用</p>}

                <button onClick={() => setShowInterests(true)} disabled={usernameValid !== true}
                  className="w-full py-3.5 rounded-2xl text-white text-base font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)' }}>
                  进入讨论 <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="animate-fade-in">
                <label className="block mb-2" style={{ fontSize: '36px', fontWeight: 700, color: '#0F172A', lineHeight: '1.2', letterSpacing: '-0.5px', fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "MiSans", "Noto Sans SC", "Microsoft YaHei", sans-serif' }}>哪些话题会让你<br/>忍不住发表观点？</label>
                <p className="text-[15px] mb-6 leading-relaxed" style={{ color: '#64748B' }}>你的首页将优先推荐这些话题。最多 8 个，随时可改。</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {INTEREST_OPTIONS.map(i => (
                    <button key={i} onClick={() => toggleInterest(i)}
                      className={`px-4 py-2 text-sm rounded-full border-2 transition-all duration-200 font-medium ${
                        selectedInterests.includes(i)
                          ? 'border-transparent text-white shadow-md scale-105'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      style={selectedInterests.includes(i) ? { background: 'linear-gradient(135deg, #2563EB, #4F46E5)' } : {}}>
                      {i}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-4">
                  {selectedInterests.length > 0 ? (
                    <span className="text-sm font-medium" style={{ color: '#2563EB' }}>已选 {selectedInterests.length} 个领域</span>
                  ) : (
                    <span className="text-sm" style={{ color: '#94A3B8' }}>选择一个你感兴趣的</span>
                  )}
                  {selectedInterests.length > 0 && (
                    <button onClick={() => setSelectedInterests([])} className="text-xs hover:underline" style={{ color: '#94A3B8' }}>清空</button>
                  )}
                </div>

                <button onClick={handleRegister} disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-white text-base font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)' }}>
                  {selectedInterests.length > 0 ? `开始探索 · ${selectedInterests.length} 个领域` : '跳过，开始探索'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-center mt-3" style={{ color: '#94A3B8' }}>加入后可参与 294 个辩题讨论</p>
                <button onClick={() => setShowInterests(false)}
                  className="w-full text-xs font-medium mt-2 hover:underline" style={{ color: '#94A3B8' }}>返回上一步</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
