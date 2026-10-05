import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-xl font-bold text-gray-900 mb-6">账号设置</h1>

      <div className="bg-white rounded-md border border-gray-100 p-6">
        <SettingsForm
          userId={user.id}
          currentUsername={profile?.username || ''}
          currentBio={profile?.bio || ''}
          currentAvatarUrl={profile?.avatar_url || null}
          currentGender={profile?.gender || null}
          currentInterests={profile?.interests || []}
          currentLanguage={profile?.language || 'zh-CN'}
          currentUid={profile?.uid || null}
          deletionRequestedAt={profile?.deletion_requested_at || null}
          topicsPrivate={profile?.topics_private || false}
          commentsPrivate={profile?.comments_private || false}
          followersPrivate={profile?.followers_private || false}
          followingPrivate={profile?.following_private || false}
          messagePrivacy={profile?.message_privacy || 'all'}
          currentFontSize={profile?.font_size || 'medium'}
          usernameChanges={profile?.username_changes || 0}
          lastChangeYear={profile?.last_username_change_year || new Date().getFullYear()}
        />
      </div>
    </div>
  )
}
