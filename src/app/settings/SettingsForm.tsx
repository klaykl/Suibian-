'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang, type Lang } from '@/lib/language'
import toast from 'react-hot-toast'
import { Save, Camera, Upload, AlertTriangle, Type, Eye, EyeOff } from 'lucide-react'

const INTEREST_OPTIONS = ['科技','编程','AI','互联网','数码','职场','创业','管理','商业','社会','生活','情感','家庭','健康','哲学','心理','历史','文学','艺术','教育','法律','经济','环境','体育','游戏','娱乐','音乐','电影','美食','旅行','国际','军事']

interface Props {
  userId: string; currentUsername: string; currentBio: string; currentAvatarUrl: string | null
  currentGender: string | null; currentInterests: string[]; currentLanguage: string
  currentUid: number | null; deletionRequestedAt: string | null
  topicsPrivate: boolean; commentsPrivate: boolean; followersPrivate: boolean; followingPrivate: boolean; messagePrivacy: string; currentFontSize: string
  usernameChanges: number; lastChangeYear: number
}
const MAX_USERNAME_CHANGES = 3

export function SettingsForm({ userId, currentUsername, currentBio, currentAvatarUrl, currentGender, currentInterests, currentLanguage, currentUid, deletionRequestedAt, topicsPrivate, commentsPrivate, followersPrivate, followingPrivate, messagePrivacy, currentFontSize, usernameChanges, lastChangeYear }: Props) {
  const { lang, setLang, tSync } = useLang()
  const [username, setUsername] = useState(currentUsername)
  const [bio, setBio] = useState(currentBio)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [gender, setGender] = useState(currentGender || '')
  const [language, setLanguage] = useState(currentLanguage || 'zh-CN')
  const [fontSize, setFontSize] = useState(currentFontSize || 'medium')
  const [topicsPriv, setTopicsPriv] = useState(topicsPrivate)
  const [commentsPriv, setCommentsPriv] = useState(commentsPrivate)
  const [followersPriv, setFollowersPriv] = useState(followersPrivate)
  const [followingPriv, setFollowingPriv] = useState(followingPrivate)
  const [msgPrivacy, setMsgPrivacy] = useState(messagePrivacy)
  const [interests, setInterests] = useState<string[]>(Array.isArray(currentInterests) ? currentInterests : [])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const currentYear = new Date().getFullYear()
  const remainingChanges = lastChangeYear < currentYear ? MAX_USERNAME_CHANGES : Math.max(0, MAX_USERNAME_CHANGES - usernameChanges)
  const usernameChanged = username !== currentUsername && username.trim() !== ''

  // Deletion cooldown
  const deletionDate = deletionRequestedAt ? new Date(deletionRequestedAt) : null
  const deletionEnd = deletionDate ? new Date(deletionDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null
  const deletionRemaining = deletionEnd ? Math.max(0, Math.ceil((deletionEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
  const canDeleteNow = deletionRequestedAt && deletionRemaining === 0

  function toggleInterest(i: string) {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 8 ? [...prev, i] : prev)
  }

  function applyFontSize(size: string) {
    setFontSize(size)
    if (size === 'small') document.documentElement.style.fontSize = '14px'
    else if (size === 'large') document.documentElement.style.fontSize = '18px'
    else document.documentElement.style.fontSize = '16px'
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 5*1024*1024) { toast.error('图片不超过 5MB'); return }
    setUploading(true)
    const supabase = createClient()
    const path = `${userId}/${Date.now()}.${(file.name.split('.').pop()||'jpg')}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { toast.error('上传失败'); setUploading(false); return }
    const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
    setAvatarUrl(url); toast.success('头像已更新'); router.refresh(); setUploading(false); e.target.value = ''
  }

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()
    if (usernameChanged) {
      if (!remainingChanges) { toast.error('今年改名次数已用完'); setLoading(false); return }
      if (username.trim().length < 2 || username.trim().length > 20) { toast.error('用户名 2-20 字符'); setLoading(false); return }
      await supabase.auth.updateUser({ data: { username: username.trim() } })
      await supabase.from('profiles').update({ username: username.trim(), username_changes: lastChangeYear < currentYear ? 1 : usernameChanges + 1, last_username_change_year: currentYear }).eq('id', userId)
      toast.success('用户名已更新')
    }
    await supabase.from('profiles').update({
      bio: bio.trim() || null, gender: gender || null, language,
      font_size: fontSize,
      topics_private: topicsPriv, comments_private: commentsPriv,
      followers_private: followersPriv, following_private: followingPriv,
      message_privacy: msgPrivacy,
      interests: JSON.stringify(interests),
    }).eq('id', userId)
    toast.success('已保存')
    router.refresh(); setLoading(false)
  }

  async function requestDeletion() {
    if (!confirm('确定要注销账号吗？注销后将有 7 天冷却期，期间可随时取消。7 天后账号永久删除，所有数据不可恢复。')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ deletion_requested_at: new Date().toISOString() }).eq('id', userId)
    toast.success('注销请求已提交，7 天后自动删除。期间再次登录可取消。')
    router.refresh(); setLoading(false); setDeleteConfirming(false)
  }

  async function cancelDeletion() {
    if (!confirm('确定要取消注销请求吗？')) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ deletion_requested_at: null }).eq('id', userId)
    toast.success('注销请求已取消')
    router.refresh(); setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* 头像 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">头像</label>
        <div className="flex items-center gap-4">
          {avatarUrl ? <img src={avatarUrl} className="w-20 h-20 rounded-full object-cover border" alt=""/> :
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zhihu-blue to-zhihu-red flex items-center justify-center text-3xl font-bold text-white">{(currentUsername||'?')[0].toUpperCase()}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1.5"><Upload className="w-3.5 h-3.5"/>上传照片</button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1.5"><Camera className="w-3.5 h-3.5"/>拍照</button>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" capture="environment" onChange={handleAvatarUpload} className="hidden"/>
        </div>
      </div>

      {/* UID — read only */}
      {currentUid && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">账号 ID（不可更改）</label>
          <p className="text-sm text-gray-500 bg-gray-50 rounded-md px-4 py-2.5 select-all">{String(currentUid)}</p>
        </div>
      )}

      {/* 用户名 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} minLength={2} maxLength={20}
          className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-zhihu-blue"/>
        <div className="flex justify-between mt-1.5"><p className="text-xs text-gray-400">2-20 字符</p><p className={`text-xs ${remainingChanges>0?'text-gray-500':'text-red-500'}`}>{remainingChanges>0?`今年还可改名 ${remainingChanges} 次`:<>改名次数已用完</>}</p></div>
      </div>

      {/* 性别 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">性别（选填，公开展示）</label>
        <div className="flex gap-2">
          {[{v:'male',l:'男'},{v:'female',l:'女'},{v:'other',l:'其他'}].map(o => (
            <button key={o.v} type="button" onClick={() => setGender(gender===o.v?'':o.v)}
              className={`px-4 py-2 text-sm rounded-md border transition-colors ${gender===o.v?'border-zhihu-blue bg-blue-50 text-zhihu-blue font-medium':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{o.l}</button>
          ))}
        </div>
      </div>

      {/* 字体大小 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><Type className="w-4 h-4"/>字体大小</label>
        <div className="flex gap-2">
          {[{v:'small',l:'小'},{v:'medium',l:'中'},{v:'large',l:'大'}].map(o => (
            <button key={o.v} type="button" onClick={() => applyFontSize(o.v)}
              className={`px-4 py-2 text-sm rounded-md border transition-colors ${fontSize===o.v?'border-zhihu-blue bg-blue-50 text-zhihu-blue font-medium':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{o.l}</button>
          ))}
        </div>
      </div>

      {/* 简介 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">个人简介</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="介绍一下你自己..." rows={3} maxLength={280}
          className="w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-zhihu-blue"/>
        <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/280</p>
      </div>

      {/* 语言 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">界面语言</label>
        <div className="flex gap-2">
          {[{v:'zh-CN',l:'简体中文'},{v:'zh-TW',l:'繁體中文'},{v:'en',l:'English'}].map(o => (
            <button key={o.v} type="button" onClick={() => { setLanguage(o.v); setLang(o.v as Lang) }}
              className={`px-4 py-2 text-sm rounded-md border transition-colors ${language===o.v?'border-zhihu-blue bg-blue-50 text-zhihu-blue font-medium':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{o.l}</button>
          ))}
        </div>
      </div>

      {/* 隐私设置 */}
      <div className="border-t border-gray-100 pt-5">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5"><EyeOff className="w-4 h-4"/>隐私设置</label>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-gray-800">谁可以给我发私信</p>
              <p className="text-xs text-gray-400">{msgPrivacy === 'all' ? '所有人' : '仅互相关注的人'}</p>
            </div>
            <button onClick={() => setMsgPrivacy(msgPrivacy === 'all' ? 'mutual' : 'all')}
              className={`relative w-11 h-6 rounded-full transition-colors ${msgPrivacy === 'mutual' ? 'bg-zhihu-blue' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${msgPrivacy === 'mutual' ? 'translate-x-5' : ''}`}/>
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-gray-800">参与的话题仅自己可见</p>
              <p className="text-xs text-gray-400">开启后，别人看不到你参与了哪些话题</p>
            </div>
            <button onClick={() => setTopicsPriv(!topicsPriv)}
              className={`relative w-11 h-6 rounded-full transition-colors ${topicsPriv ? 'bg-zhihu-blue' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${topicsPriv ? 'translate-x-5' : ''}`}/>
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-gray-800">发表的观点仅自己可见</p>
              <p className="text-xs text-gray-400">开启后，你的评论将不对其他用户展示</p>
            </div>
            <button onClick={() => setCommentsPriv(!commentsPriv)}
              className={`relative w-11 h-6 rounded-full transition-colors ${commentsPriv ? 'bg-zhihu-blue' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${commentsPriv ? 'translate-x-5' : ''}`}/>
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-gray-800">关注列表仅自己可见</p>
              <p className="text-xs text-gray-400">开启后，别人看不到你关注了谁</p>
            </div>
            <button onClick={() => setFollowingPriv(!followingPriv)}
              className={`relative w-11 h-6 rounded-full transition-colors ${followingPriv ? 'bg-zhihu-blue' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${followingPriv ? 'translate-x-5' : ''}`}/>
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-gray-800">粉丝列表仅自己可见</p>
              <p className="text-xs text-gray-400">开启后，别人看不到谁关注了你</p>
            </div>
            <button onClick={() => setFollowersPriv(!followersPriv)}
              className={`relative w-11 h-6 rounded-full transition-colors ${followersPriv ? 'bg-zhihu-blue' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${followersPriv ? 'translate-x-5' : ''}`}/>
            </button>
          </div>
        </div>
      </div>

      {/* 兴趣 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          兴趣领域 <span className="text-gray-400 font-normal">（仅自己可见，用于内容推荐，最多8个）</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {INTEREST_OPTIONS.map(i => (
            <button key={i} type="button" onClick={() => toggleInterest(i)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${interests.includes(i)?'bg-zhihu-blue text-white border-zhihu-blue':'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{i}</button>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={loading}
        className="w-full py-2.5 bg-zhihu-blue text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
        <Save className="w-4 h-4"/>{loading?'保存中...':'保存修改'}
      </button>

      {/* 注销账号 */}
      <div className="border-t border-red-100 pt-5 mt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-600 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4"/>注销账号</p>
            {deletionRequestedAt && !canDeleteNow && (
              <p className="text-xs text-red-500 mt-1">注销中，还剩 {deletionRemaining} 天。7 天后自动删除。</p>
            )}
            {canDeleteNow && (
              <p className="text-xs text-red-600 mt-1">冷却期已过，账号将在下次操作时永久删除。</p>
            )}
          </div>
          {!deletionRequestedAt ? (
            <button onClick={() => setDeleteConfirming(true)}
              className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors">申请注销</button>
          ) : (
            <button onClick={cancelDeletion}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors">取消注销</button>
          )}
        </div>
        {deleteConfirming && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800 mb-2">确认申请注销账号？注销后有 7 天冷却期，期间登录即取消。</p>
            <div className="flex gap-2">
              <button onClick={requestDeletion} disabled={loading} className="px-4 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">{loading?'处理中...':'确认注销'}</button>
              <button onClick={() => setDeleteConfirming(false)} className="px-4 py-1.5 text-sm text-gray-600">取消</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
