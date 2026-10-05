'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LiveTopic({ topicId }: { topicId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let affChannel: ReturnType<typeof supabase.channel> | null = null
    let commentChannel: ReturnType<typeof supabase.channel> | null = null
    let upvoteChannel: ReturnType<typeof supabase.channel> | null = null

    try {
      // Subscribe to affiliation changes (side switching, new joins)
      affChannel = supabase
        .channel(`affiliations-${topicId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'affiliations',
          filter: `topic_id=eq.${topicId}`,
        }, () => {
          router.refresh()
        })
        .subscribe()

      // Subscribe to new comments
      commentChannel = supabase
        .channel(`comments-${topicId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `topic_id=eq.${topicId}`,
        }, () => {
          router.refresh()
        })
        .subscribe()

      // Subscribe to comment upvotes
      upvoteChannel = supabase
        .channel(`upvotes-${topicId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'upvotes',
        }, () => {
          router.refresh()
        })
        .subscribe()
    } catch {
      // Realtime connection failed — page works fine without live updates
    }

    return () => {
      try {
        if (affChannel) supabase.removeChannel(affChannel)
        if (commentChannel) supabase.removeChannel(commentChannel)
        if (upvoteChannel) supabase.removeChannel(upvoteChannel)
      } catch { /* cleanup errors are non-critical */ }
    }
  }, [topicId, router])

  return null
}
