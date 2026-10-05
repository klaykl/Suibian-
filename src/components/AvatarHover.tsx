'use client'

import Link from 'next/link'
import { Camera } from 'lucide-react'

export function AvatarHover({ avatarUrl, initial, isOwn }: {
  avatarUrl: string | null; initial: string; isOwn: boolean
}) {
  const content = avatarUrl ? (
    <img src={avatarUrl} className="w-16 h-16 rounded-full object-cover border shrink-0" alt="" />
  ) : (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zhihu-blue to-zhihu-red flex items-center justify-center text-2xl font-bold text-white shrink-0">
      {initial}
    </div>
  )

  if (!isOwn) return content

  return (
    <Link href="/settings" className="relative group shrink-0 block">
      {content}
      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera className="w-5 h-5 text-white" />
      </div>
      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        更换头像
      </span>
    </Link>
  )
}
