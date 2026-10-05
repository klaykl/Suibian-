'use client'

import { useState } from 'react'
import { FollowListModal } from './FollowListModal'

export function ProfileStats({ userId, isOwn, followingCount, followersCount, totalUpvotes, weeklyScore, monthlyScore, yearlyScore }: {
  userId: string; isOwn: boolean
  followingCount: number; followersCount: number; totalUpvotes: number
  weeklyScore: number; monthlyScore: number; yearlyScore: number
}) {
  const [modalType, setModalType] = useState<'following' | 'followers' | null>(null)

  const canView = isOwn // For now, only owner can see lists. Could be extended for public profiles.

  return (
    <>
      <div className="flex items-center gap-5 text-sm mt-3">
        <button
          onClick={() => canView && setModalType('following')}
          className={`text-center ${canView ? 'cursor-pointer hover:opacity-70' : 'cursor-default'}`}
        >
          <p className="font-bold text-gray-900">{followingCount || 0}</p>
          <p className="text-xs text-gray-400">关注</p>
        </button>
        <button
          onClick={() => canView && setModalType('followers')}
          className={`text-center ${canView ? 'cursor-pointer hover:opacity-70' : 'cursor-default'}`}
        >
          <p className="font-bold text-gray-900">{followersCount || 0}</p>
          <p className="text-xs text-gray-400">粉丝</p>
        </button>
        <div className="text-center">
          <p className="font-bold text-gray-900">{totalUpvotes}</p>
          <p className="text-xs text-gray-400">获赞</p>
        </div>
        <div className="h-8 w-px bg-gray-100" />
        <div className="text-center">
          <p className="font-bold text-gray-700 text-xs">{weeklyScore}</p>
          <p className="text-[10px] text-gray-400">周赞</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-700 text-xs">{monthlyScore}</p>
          <p className="text-[10px] text-gray-400">月赞</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-700 text-xs">{yearlyScore}</p>
          <p className="text-[10px] text-gray-400">年赞</p>
        </div>
      </div>

      {modalType && (
        <FollowListModal
          userId={userId}
          type={modalType}
          open={!!modalType}
          onClose={() => setModalType(null)}
        />
      )}
    </>
  )
}
