'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ExperiencePage() {
  const [step, setStep] = useState<'pick' | 'result' | 'stats'>('pick')
  const [userPick, setUserPick] = useState<string | null>(null)
  const [thought, setThought] = useState('')
  const router = useRouter()

  function finishOnboarding() {
    toast.success('欢迎加入随辩！')
    router.push('/'); router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%)' }}>
      <div className="w-full" style={{ maxWidth: '480px' }}>
        {/* Back button */}
        <button onClick={() => {
          if (step === 'pick') router.push('/register?step=interests')
          else setStep(step === 'stats' ? 'result' : 'pick')
        }}
          className="flex items-center gap-1.5 text-sm mb-4 hover:underline" style={{ color: '#94A3B8' }}>
          <ArrowLeft className="w-3.5 h-3.5" />返回上一步
        </button>

        <div className="bg-white rounded-3xl p-10" style={{ boxShadow: '0 8px 32px rgba(15,23,42,.08)', border: '1px solid #E7EFFF' }}>
          {step === 'pick' ? (
            <div className="animate-fade-in text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, #2563EB, #4F46E5)' }}>
                ⚡
              </div>
              <h1 className="text-[28px] font-bold mb-3" style={{ color: '#0F172A', lineHeight: '1.2', fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "MiSans", "Noto Sans SC", "Microsoft YaHei", sans-serif' }}>
                你的第一场随辩
              </h1>
              <p className="text-[15px] mb-8 leading-relaxed" style={{ color: '#64748B' }}>
                没有标准答案，<br/>选一个更接近你的想法。
              </p>

              <p className="text-base font-bold mb-6 leading-snug" style={{ color: '#0F172A' }}>
                看到更有说服力的观点后，<br/>你会改变自己的立场吗？
              </p>

              <div className="space-y-3">
                <button onClick={() => { setUserPick('for'); setStep('result') }}
                  className="w-full py-4 rounded-2xl text-base font-bold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-2"
                  style={{ borderColor: '#2563EB', color: '#2563EB', backgroundColor: '#EFF6FF' }}>
                  会，观点应该跟着认知更新
                </button>
                <button onClick={() => { setUserPick('against'); setStep('result') }}
                  className="w-full py-4 rounded-2xl text-base font-bold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-2"
                  style={{ borderColor: '#E2E8F0', color: '#64748B', backgroundColor: '#F8FAFC' }}>
                  不会，立场不应该轻易改变
                </button>
              </div>
            </div>
          ) : step === 'result' ? (
            <div className="animate-fade-in text-center">
              <p className="text-sm mb-3" style={{ color: '#64748B' }}>你选择了</p>
              <p className="text-xl font-extrabold mb-6" style={{ color: userPick === 'for' ? '#2563EB' : '#64748B' }}>
                {userPick === 'for' ? '会，观点应该跟着认知更新' : '不会，立场不应该轻易改变'}
              </p>

              <p className="text-sm mb-3 leading-relaxed" style={{ color: '#64748B' }}>为什么这么选择？随辩说说</p>

              <textarea value={thought} onChange={e => setThought(e.target.value)}
                placeholder="写下你的想法..." rows={3} maxLength={500}
                className="w-full text-sm py-3 px-4 bg-gray-50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all placeholder:text-gray-400 resize-none mb-4"
                style={{ border: '1.5px solid #E2E8F0' }} />

              <button onClick={() => setStep('stats')} disabled={!thought.trim()}
                className="w-full py-3.5 rounded-2xl text-white text-base font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)' }}>
                说完了，看结果 <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => setStep('stats')}
                className="w-full text-xs font-medium mt-3 hover:underline" style={{ color: '#94A3B8' }}>不想说，直接看统计</button>
            </div>
          ) : (
            <div className="animate-fade-in text-center">
              <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: '#F8FAFC' }}>
                <p className="text-xs mb-3 font-medium" style={{ color: '#64748B' }}>社区当前观点分布</p>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="text-sm font-bold" style={{ color: '#2563EB' }}>会 63%</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: '#E2E8F0' }}>
                    <div className="h-full rounded-full" style={{ width: '63%', background: 'linear-gradient(90deg, #2563EB, #4F46E5)' }} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold" style={{ color: '#94A3B8' }}>不会 37%</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: '#E2E8F0' }}>
                    <div className="h-full rounded-full" style={{ width: '37%', backgroundColor: '#CBD5E1' }} />
                  </div>
                </div>
              </div>

              <button onClick={finishOnboarding}
                className="w-full py-3.5 rounded-2xl text-white text-base font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)' }}>
                开始探索 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
