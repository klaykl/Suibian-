'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(undefined)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null))
  }, [])

  // If user is null (checked and not logged in), intercept clicks
  if (user === null) {
    return (
      <div onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        router.push('/login')
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          {children}
        </div>
      </div>
    )
  }

  // User logged in or still loading — render normally
  return <>{children}</>
}
