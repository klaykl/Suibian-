import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MessageSquare, GitBranch, UserPlus, UserCheck, MessageCircle, Users, Heart } from 'lucide-react'
import { FriendButton } from './FriendButton'
import { AvatarHover } from '@/components/AvatarHover'
import { ProfileStats } from '@/components/ProfileStats'

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const currentUser = await getUser()

  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error || !profile) notFound()

  // Get comments for stats
  const { data: comments } = await supabase.from('comments').select('*, topics:topic_id(title)').eq('user_id', id).order('created_at', { ascending: false }).limit(20)

  // Total upvotes received
  const { data: upvData } = await supabase.from('comments').select('upvote_count').eq('user_id', id)
  const totalUpvotes = (upvData || []).reduce((sum: number, c: any) => sum + (c.upvote_count || 0), 0)

  // Period stats
  const { data: periodStats } = await supabase.rpc('get_user_period_stats', { uid: id })
  const weeklyScore = periodStats?.[0]?.weekly_score || 0
  const monthlyScore = periodStats?.[0]?.monthly_score || 0
  const yearlyScore = periodStats?.[0]?.yearly_score || 0

  // Following count (accepted friends where user is the requester)
  const { count: followingCount } = await supabase.from('friends').select('*', { count: 'exact', head: true }).eq('user_id', id).eq('status', 'accepted')

  // Followers count (accepted friends where user is the target)
  const { count: followersCount } = await supabase.from('friends').select('*', { count: 'exact', head: true }).eq('friend_id', id).eq('status', 'accepted')

  // Participated topics (private)
  const { data: affiliations } = await supabase.from('affiliations').select('*, topics:topic_id(title)').eq('user_id', id)
  const { count: switchCount } = await supabase.from('affiliation_changes').select('*', { count: 'exact', head: true }).eq('user_id', id)

  // Friend status
  let friendStatus: string = 'none'
  if (currentUser && currentUser.id !== id) {
    const { data: f } = await supabase.from('friends').select('*')
      .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${currentUser.id})`).maybeSingle()
    if (f) friendStatus = f.status
  }

  const isOwn = currentUser?.id === id
  const genderLabel = profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : profile.gender === 'other' ? '其他' : null
  const uid = profile.uid ? String(profile.uid) : null

  // Auto-title based on score
  const score = profile.points || 0
  const autoTitle = score >= 5000 ? '随辩贤者' : score >= 1500 ? '说服者' : score >= 500 ? '辩手' : score >= 100 ? '思考者' : '观察者'

  // How many people has this user convinced (changed sides)
  const { count: convincedCount } = await supabase.from('affiliation_changes').select('*', { count: 'exact', head: true }).eq('user_id', id)
  const { count: bestArgCount } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', id).gte('upvote_count', 10)

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6"><ArrowLeft className="w-3.5 h-3.5"/>返回首页</Link>

      {/* Profile header */}
      <div className="bg-white rounded-md border border-gray-100 p-6 mb-8">
        <div className="flex items-start gap-4">
          <AvatarHover avatarUrl={profile.avatar_url} initial={(profile.username||'?')[0].toUpperCase()} isOwn={isOwn} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{profile.username}</h1>
              {genderLabel && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{genderLabel}</span>}
              {uid && <span className="text-xs text-gray-300 select-all">ID: {uid}</span>}
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                🏅 {profile.title || autoTitle}
              </span>
            </div>
            {profile.bio ? <p className="text-sm text-gray-600 leading-relaxed mb-2">{profile.bio}</p> :
              isOwn && <p className="text-sm text-gray-400 italic mb-2"><Link href="/settings" className="text-zhihu-blue hover:underline">填写简介</Link></p>}
            <div className="flex items-center gap-4 text-xs mt-2" style={{ color: '#64748B' }}>
              <span>⭐ {score} 说服力</span>
              <span>↔ 说服过 {convincedCount || 0} 人</span>
              <span>⭐ {bestArgCount || 0} 条优质观点</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5 text-sm mt-3">
              <ProfileStats
                userId={id} isOwn={isOwn}
                followingCount={followingCount || 0} followersCount={followersCount || 0}
                totalUpvotes={totalUpvotes}
                weeklyScore={Number(weeklyScore)} monthlyScore={Number(monthlyScore)} yearlyScore={Number(yearlyScore)}
              />
              <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                <Calendar className="w-3 h-3"/>{new Date(profile.created_at).toLocaleDateString('zh-CN')} 加入
              </div>
            </div>
          </div>
          {!isOwn && currentUser && (
            <div className="flex items-center gap-2">
              <FriendButton userId={currentUser.id} targetId={id} initialStatus={friendStatus} targetName={profile.username} />
              {(profile.message_privacy !== 'mutual' || friendStatus === 'accepted') && (
                <Link href={`/messages?to=${id}`} className="px-4 py-2 text-sm border border-zhihu-blue text-zhihu-blue rounded-md hover:bg-blue-50 transition-colors flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4"/>发私信
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Own topics (private or visible based on setting) */}
      {affiliations && affiliations.length > 0 && (isOwn || !profile.topics_private) && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            参与的话题
            {(isOwn && profile.topics_private) && <span className="text-gray-300 font-normal ml-1">仅自己可见</span>}
          </h2>
          <div className="space-y-1.5">
            {affiliations.map((aff: any) => (
              <Link key={aff.id} href={`/topics/${aff.topic_id}`} className="bg-white rounded-md border border-gray-100 px-4 py-2.5 flex items-center justify-between hover:border-gray-200 transition-colors">
                <span className="text-sm text-gray-700 truncate flex-1">{aff.topics?.title || '未知话题'}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ml-3 ${aff.side==='for'?'bg-blue-50 text-zhihu-blue':'bg-red-50 text-zhihu-red'}`}>{aff.side==='for'?'正方':'反方'}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comments — respect privacy */}
      {comments && comments.length > 0 && (isOwn || !profile.comments_private) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            发表的观点
            {(isOwn && profile.comments_private) && <span className="text-gray-300 font-normal ml-1">仅自己可见</span>}
          </h2>
          <div className="space-y-3">
            {(comments as any[]).map((c: any) => (
              <Link key={c.id} href={`/topics/${c.topic_id}`} className="block bg-white rounded-md border border-gray-100 p-4 hover:border-gray-200 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${c.side_at_time==='for'?'bg-blue-50 text-zhihu-blue':'bg-red-50 text-zhihu-red'}`}>
                    {c.side_at_time==='for'?'正方':'反方'}
                  </span>
                  <span className="text-xs text-gray-400">在「{c.topics?.title}」中</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">{c.body}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{c.upvote_count} 赞</span>
                  <span>{new Date(c.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
