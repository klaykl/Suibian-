import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export async function getSession() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()
  return data.session
}

export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Check if account deletion cooldown has expired
  const { data: profile } = await supabase
    .from('profiles')
    .select('deletion_requested_at')
    .eq('id', user.id)
    .single()

  if (profile?.deletion_requested_at) {
    const deletionDate = new Date(profile.deletion_requested_at)
    const cooldownEnd = new Date(deletionDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    if (Date.now() >= cooldownEnd.getTime()) {
      // Cooldown expired — clear UID and profile, sign out
      await supabase.from('profiles').update({
        uid: null,
        deletion_requested_at: null,
        bio: null,
        avatar_url: null,
        interests: '[]',
      }).eq('id', user.id)
      await supabase.auth.signOut()
      return null
    }
    // Still in cooldown — user returned, cancel deletion
    await supabase.from('profiles').update({ deletion_requested_at: null }).eq('id', user.id)
  }

  return user
})

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  // Check both metadata and profiles table (metadata can be stale)
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  const isAdmin = user.user_metadata?.is_admin === true || profile?.is_admin === true
  if (!isAdmin) {
    redirect('/')
  }
  return user
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()
  return profile?.is_admin === true
}
