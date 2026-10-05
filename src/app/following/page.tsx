import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { TopicCard } from '@/components/TopicCard'
import Link from 'next/link'

export default async function FollowingPage() {
  const user = await getUser()
  if (!user) return <div className="max-w-5xl mx-auto px-6 py-16 text-center text-gray-400">请先登录</div>

  const supabase = await createClient()
  // Get friends' activities
  const { data: friends } = await supabase.from('friends').select('friend_id').eq('user_id', user.id).eq('status', 'accepted')
  const friendIds = (friends || []).map((f: any) => f.friend_id)

  if (friendIds.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <p className="text-gray-500 font-medium mb-2">还没有关注的好友</p>
        <p className="text-gray-400 text-sm">去话题里发现有趣的人，加他们为好友吧</p>
      </div>
    )
  }

  // Get comments from friends
  const { data: comments } = await supabase
    .from('comments').select('*, topics:topic_id(title, id)').in('user_id', friendIds)
    .order('created_at', { ascending: false }).limit(30)

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-[22px] font-bold text-gray-900 mb-6">关注</h1>
      {!comments || comments.length === 0 ? (
        <p className="text-center text-gray-400 py-10">关注的好友还没有发表观点</p>
      ) : (
        <div className="space-y-3">
          {(comments as any[]).map((c: any) => (
            <Link key={c.id} href={`/topics/${c.topic_id}`}
              className="block bg-white rounded-md border border-gray-100 p-4 hover:border-gray-200 transition-colors">
              <p className="text-xs text-gray-400 mb-1">在「{c.topics?.title}」中发表</p>
              <p className="text-sm text-gray-700 line-clamp-3">{c.body}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
