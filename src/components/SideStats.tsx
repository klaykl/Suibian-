'use client'

import { ArrowLeftRight } from 'lucide-react'
import { useLang } from '@/lib/language'

interface Props { forCount: number; againstCount: number; switchForToAgainst: number; switchAgainstToFor: number }

export function SideStats({ forCount, againstCount, switchForToAgainst, switchAgainstToFor }: Props) {
  const total = forCount + againstCount
  const forPct = total > 0 ? Math.round((forCount / total) * 100) : 50
  const againstPct = 100 - forPct
  const totalSwitches = switchForToAgainst + switchAgainstToFor
  const { tSync } = useLang()

  return (
    <div className="bg-white rounded-md border border-ivory-dark p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4"><span suppressHydrationWarning>{tSync('topic.stats')}</span></p>
      <div className="flex items-center justify-center gap-8 mb-5">
        <div className="text-center">
          <p className="text-[32px] font-bold text-zhihu-blue tracking-tight tabular-nums">{forCount}</p>
          <p className="text-xs text-gray-400 mt-0.5"><span suppressHydrationWarning>{tSync('topic.for')}</span></p>
        </div>
        <div className="text-center"><p className="text-sm font-medium text-gray-300">{tSync('topic.vs')}</p></div>
        <div className="text-center">
          <p className="text-[32px] font-bold text-zhihu-red tracking-tight tabular-nums">{againstCount}</p>
          <p className="text-xs text-gray-400 mt-0.5"><span suppressHydrationWarning>{tSync('topic.against')}</span></p>
        </div>
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden flex mb-4">
        <div className="h-full bg-zhihu-blue rounded-l-full transition-all duration-500 flex items-center justify-end pr-2" style={{ width: `${forPct}%`, minWidth: forPct>15?'32px':'0px' }}>
          {forPct>=25 && <span className="text-[10px] text-white font-bold">{forPct}%</span>}
        </div>
        <div className="h-full bg-zhihu-red rounded-r-full transition-all duration-500 flex items-center justify-start pl-2" style={{ width: `${againstPct}%`, minWidth: againstPct>15?'32px':'0px' }}>
          {againstPct>=25 && <span className="text-[10px] text-white font-bold">{againstPct}%</span>}
        </div>
      </div>
      {totalSwitches>0?(
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-ivory-dark text-xs">
          <ArrowLeftRight className="w-3 h-3 text-amber-500"/>
          <span className="bg-blue-50 text-zhihu-blue px-2 py-0.5 rounded font-medium">{switchForToAgainst} <span suppressHydrationWarning>{tSync('topic.for')}</span>→<span suppressHydrationWarning>{tSync('topic.against')}</span></span>
          <span className="bg-red-50 text-zhihu-red px-2 py-0.5 rounded font-medium">{switchAgainstToFor} <span suppressHydrationWarning>{tSync('topic.against')}</span>→<span suppressHydrationWarning>{tSync('topic.for')}</span></span>
        </div>
      ):(<div className="text-center pt-3 border-t border-ivory-dark text-xs text-gray-400">{tSync('comment.empty')}</div>)}
    </div>
  )
}
