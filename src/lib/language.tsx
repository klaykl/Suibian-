'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type Lang = 'zh-CN' | 'zh-TW' | 'en'

const LANG_LABELS: Record<Lang, string> = { 'zh-CN': '简', 'zh-TW': '繁', 'en': 'EN' }
const LANG_NAMES: Record<Lang, string> = { 'zh-CN': '简体中文', 'zh-TW': '繁體中文', 'en': 'English' }

export { LANG_LABELS, LANG_NAMES }

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (text: string) => Promise<string>
  tSync: (key: string) => string
}

const LangContext = createContext<LangContextType>({
  lang: 'zh-CN', setLang: () => {}, t: async (t) => t, tSync: (k) => k,
})

// Simple static translations for UI strings
const UI_STRINGS: Record<string, Record<Lang, string>> = {
  'nav.following': { 'zh-CN': '关注', 'zh-TW': '關注', 'en': 'Following' },
  'nav.recommend': { 'zh-CN': '推荐', 'zh-TW': '推薦', 'en': 'For You' },
  'nav.hot': { 'zh-CN': '热榜', 'zh-TW': '熱榜', 'en': 'Hot' },
  'nav.themes': { 'zh-CN': '主题', 'zh-TW': '主題', 'en': 'Themes' },
  'nav.rankings': { 'zh-CN': '排行榜', 'zh-TW': '排行榜', 'en': 'Rankings' },
  'nav.search': { 'zh-CN': '搜索话题和观点', 'zh-TW': '搜尋話題和觀點', 'en': 'Search topics and opinions' },
  'nav.login': { 'zh-CN': '登录', 'zh-TW': '登入', 'en': 'Log in' },
  'nav.register': { 'zh-CN': '注册', 'zh-TW': '註冊', 'en': 'Sign up' },
  'topic.active': { 'zh-CN': '辩论进行中', 'zh-TW': '辯論進行中', 'en': 'Debate in progress' },
  'topic.closed': { 'zh-CN': '已结束', 'zh-TW': '已結束', 'en': 'Closed' },
  'topic.for': { 'zh-CN': '正方', 'zh-TW': '正方', 'en': 'Pro' },
  'topic.against': { 'zh-CN': '反方', 'zh-TW': '反方', 'en': 'Con' },
  'topic.support_for': { 'zh-CN': '支持正方', 'zh-TW': '支持正方', 'en': 'Support Pro' },
  'topic.support_against': { 'zh-CN': '支持反方', 'zh-TW': '支持反方', 'en': 'Support Con' },
  'topic.stats': { 'zh-CN': '阵营统计', 'zh-TW': '陣營統計', 'en': 'Stats' },
  'topic.vs': { 'zh-CN': 'VS', 'zh-TW': 'VS', 'en': 'VS' },
  'comment.reply': { 'zh-CN': '回复', 'zh-TW': '回覆', 'en': 'Reply' },
  'comment.delete': { 'zh-CN': '删除', 'zh-TW': '刪除', 'en': 'Delete' },
  'comment.upvote': { 'zh-CN': '赞同', 'zh-TW': '贊同', 'en': 'Agree' },
  'comment.switched': { 'zh-CN': '换过阵营', 'zh-TW': '換過陣營', 'en': 'Switched' },
  'comment.mine': { 'zh-CN': '我的', 'zh-TW': '我的', 'en': 'Mine' },
  'comment.post': { 'zh-CN': '发布', 'zh-TW': '發佈', 'en': 'Post' },
  'comment.placeholder': { 'zh-CN': '写下你的观点，用论据说服对方...', 'zh-TW': '寫下你的觀點，用論據說服對方...', 'en': 'Share your argument...' },
  'comment.empty': { 'zh-CN': '还没有观点', 'zh-TW': '還沒有觀點', 'en': 'No opinions yet' },
  'comment.empty_hint': { 'zh-CN': '成为第一个发言的人，你的观点将引领讨论方向', 'zh-TW': '成為第一個發言的人，你的觀點將引領討論方向', 'en': 'Be the first to share your thoughts' },
  'comment.sort_hot': { 'zh-CN': '最热', 'zh-TW': '最熱', 'en': 'Top' },
  'comment.sort_new': { 'zh-CN': '最新', 'zh-TW': '最新', 'en': 'New' },
  'comment.count': { 'zh-CN': '条观点', 'zh-TW': '條觀點', 'en': 'opinions' },
  'report.title': { 'zh-CN': '举报', 'zh-TW': '舉報', 'en': 'Report' },
  'sidebar.you_are': { 'zh-CN': '你当前是', 'zh-TW': '你當前是', 'en': 'You are' },
  'sidebar.hint': { 'zh-CN': '点击另一侧可切换立场', 'zh-TW': '點擊另一側可切換立場', 'en': 'Click the other side to switch' },
  'switch.confirm_title': { 'zh-CN': '确认切换立场', 'zh-TW': '確認切換立場', 'en': 'Confirm switch' },
  'switch.confirm': { 'zh-CN': '确认', 'zh-TW': '確認', 'en': 'Confirm' },
  'switch.cancel': { 'zh-CN': '取消', 'zh-TW': '取消', 'en': 'Cancel' },
  'notification.title': { 'zh-CN': '通知', 'zh-TW': '通知', 'en': 'Notifications' },
  'notification.mark_read': { 'zh-CN': '全部已读', 'zh-TW': '全部已讀', 'en': 'Mark all read' },
  'nav.messages': { 'zh-CN': '私信', 'zh-TW': '私訊', 'en': 'Messages' },
  'nav.profile': { 'zh-CN': '个人主页', 'zh-TW': '個人主頁', 'en': 'Profile' },
  'nav.settings': { 'zh-CN': '账号设置', 'zh-TW': '帳號設定', 'en': 'Settings' },
  'nav.admin_topics': { 'zh-CN': '管理话题', 'zh-TW': '管理話題', 'en': 'Manage Topics' },
  'nav.admin_reports': { 'zh-CN': '举报管理', 'zh-TW': '舉報管理', 'en': 'Reports' },
  'nav.logout': { 'zh-CN': '退出登录', 'zh-TW': '退出登入', 'en': 'Sign out' },
  'time.just_now': { 'zh-CN': '刚刚', 'zh-TW': '剛剛', 'en': 'Just now' },
  'time.min_ago': { 'zh-CN': '分钟前', 'zh-TW': '分鐘前', 'en': 'm ago' },
  'time.hr_ago': { 'zh-CN': '小时前', 'zh-TW': '小時前', 'en': 'h ago' },
  'time.day_ago': { 'zh-CN': '天前', 'zh-TW': '天前', 'en': 'd ago' },
  'back': { 'zh-CN': '返回话题列表', 'zh-TW': '返回話題列表', 'en': 'Back to topics' },
  'switch.too_fast': { 'zh-CN': '切换太频繁，请', 'zh-TW': '切換太頻繁，請', 'en': 'Switching too fast, please wait ' },
  'switch.minutes': { 'zh-CN': '分钟后再试', 'zh-TW': '分鐘後再試', 'en': ' minutes' },
  'error.login_required': { 'zh-CN': '请先登录', 'zh-TW': '請先登入', 'en': 'Please log in first' },
  'settings.title': { 'zh-CN': '账号设置', 'zh-TW': '帳號設定', 'en': 'Settings' },
  'settings.avatar': { 'zh-CN': '头像', 'zh-TW': '頭像', 'en': 'Avatar' },
  'settings.upload': { 'zh-CN': '上传照片', 'zh-TW': '上傳照片', 'en': 'Upload' },
  'settings.camera': { 'zh-CN': '拍照', 'zh-TW': '拍照', 'en': 'Camera' },
  'settings.username': { 'zh-CN': '用户名', 'zh-TW': '用戶名', 'en': 'Username' },
  'settings.gender': { 'zh-CN': '性别（选填，公开展示）', 'zh-TW': '性別（選填，公開展示）', 'en': 'Gender (optional, public)' },
  'settings.male': { 'zh-CN': '男', 'zh-TW': '男', 'en': 'Male' },
  'settings.female': { 'zh-CN': '女', 'zh-TW': '女', 'en': 'Female' },
  'settings.other': { 'zh-CN': '其他', 'zh-TW': '其他', 'en': 'Other' },
  'settings.bio': { 'zh-CN': '个人简介', 'zh-TW': '個人簡介', 'en': 'Bio' },
  'settings.interests': { 'zh-CN': '兴趣领域', 'zh-TW': '興趣領域', 'en': 'Interests' },
  'settings.interests_hint': { 'zh-CN': '仅自己可见，用于内容推荐，最多8个', 'zh-TW': '僅自己可見，用於內容推薦，最多8個', 'en': 'Private, for recommendations, max 8' },
  'settings.language': { 'zh-CN': '界面语言', 'zh-TW': '界面語言', 'en': 'Language' },
  'settings.save': { 'zh-CN': '保存修改', 'zh-TW': '保存修改', 'en': 'Save' },
  'settings.name_changes': { 'zh-CN': '今年还可改名', 'zh-TW': '今年還可改名', 'en': 'name changes left this year: ' },
  'settings.name_limit': { 'zh-CN': '次', 'zh-TW': '次', 'en': '' },
  'profile.joined': { 'zh-CN': '加入', 'zh-TW': '加入', 'en': 'Joined' },
  'profile.switched': { 'zh-CN': '改变过', 'zh-TW': '改變過', 'en': 'Switched' },
  'profile.times': { 'zh-CN': '次立场', 'zh-TW': '次立場', 'en': ' times' },
  'profile.topics': { 'zh-CN': '参与的话题', 'zh-TW': '參與的話題', 'en': 'Topics' },
  'profile.topics_private': { 'zh-CN': '仅自己可见', 'zh-TW': '僅自己可見', 'en': 'Private' },
  'profile.comments': { 'zh-CN': '发表的观点', 'zh-TW': '發表的觀點', 'en': 'Opinions' },
  'profile.fill_bio': { 'zh-CN': '填写简介', 'zh-TW': '填寫簡介', 'en': 'Add bio' },
  'profile.send_msg': { 'zh-CN': '发私信', 'zh-TW': '發私訊', 'en': 'Message' },
  'profile.add_friend': { 'zh-CN': '加好友', 'zh-TW': '加好友', 'en': 'Add Friend' },
  'profile.accepted': { 'zh-CN': '已添加', 'zh-TW': '已添加', 'en': 'Friends' },
  'profile.pending': { 'zh-CN': '等待通过', 'zh-TW': '等待通過', 'en': 'Pending' },
  'profile.accept': { 'zh-CN': '接受好友请求', 'zh-TW': '接受好友請求', 'en': 'Accept Request' },
  'profile.change_avatar': { 'zh-CN': '更换头像', 'zh-TW': '更換頭像', 'en': 'Change Avatar' },
  'profile.empty_bio': { 'zh-CN': '你还未填写简介，', 'zh-TW': '你還未填寫簡介，', 'en': 'No bio yet. ' },
  'profile.go_write': { 'zh-CN': '去填写', 'zh-TW': '去填寫', 'en': 'Write one' },
  'home.title': { 'zh-CN': '随辩', 'zh-TW': '隨辯', 'en': 'Suibian' },
  'home.subtitle': { 'zh-CN': '选择立场，发表观点，随时改变想法。每个数据背后，都有人在思考。', 'zh-TW': '選擇立場，發表觀點，隨時改變想法。每個數據背後，都有人在思考。', 'en': 'Pick a side. Make your case. Change your mind.' },
  'home.active': { 'zh-CN': '进行中', 'zh-TW': '進行中', 'en': 'Active' },
  'home.closed': { 'zh-CN': '已结束', 'zh-TW': '已結束', 'en': 'Closed' },
  'home.empty': { 'zh-CN': '还没有话题', 'zh-TW': '還沒有話題', 'en': 'No topics yet' },
  'home.empty_hint': { 'zh-CN': '管理员正在筹备第一个辩论话题', 'zh-TW': '管理員正在籌備第一個辯論話題', 'en': 'Admin is preparing the first topic' },
  'font.size': { 'zh-CN': '字体大小', 'zh-TW': '字體大小', 'en': 'Font Size' },
  'font.small': { 'zh-CN': '小', 'zh-TW': '小', 'en': 'Small' },
  'font.medium': { 'zh-CN': '中', 'zh-TW': '中', 'en': 'Medium' },
  'font.large': { 'zh-CN': '大', 'zh-TW': '大', 'en': 'Large' },
  'common.all': { 'zh-CN': '全部', 'zh-TW': '全部', 'en': 'All' },
  'common.more': { 'zh-CN': '更多', 'zh-TW': '更多', 'en': 'More' },
  'common.less': { 'zh-CN': '收起', 'zh-TW': '收起', 'en': 'Less' },
  'common.back': { 'zh-CN': '返回', 'zh-TW': '返回', 'en': 'Back' },
  'common.empty': { 'zh-CN': '暂无数据', 'zh-TW': '暫無數據', 'en': 'No data' },
  'common.loading': { 'zh-CN': '加载中...', 'zh-TW': '加載中...', 'en': 'Loading...' },
  'hot.title': { 'zh-CN': '热点速辩', 'zh-TW': '熱點速辯', 'en': 'Hot Debates' },
  'hot.subtitle': { 'zh-CN': '基于实时新闻引发的辩论，参与热点讨论', 'zh-TW': '基於實時新聞引發的辯論，參與熱點討論', 'en': 'News-driven debates. Join the discussion.' },
  'hot.updated': { 'zh-CN': '24h 更新', 'zh-TW': '24h 更新', 'en': '24h Updated' },
  'hot.featured': { 'zh-CN': '今日最热', 'zh-TW': '今日最熱', 'en': 'Hottest Today' },
  'hot.enter': { 'zh-CN': '进入辩论 →', 'zh-TW': '進入辯論 →', 'en': 'Join Debate →' },
  'hot.background': { 'zh-CN': '新闻背景', 'zh-TW': '新聞背景', 'en': 'Background' },
  'hot.banner': { 'zh-CN': '新闻驱动', 'zh-TW': '新聞驅動', 'en': 'News-Driven' },
  'shop.title': { 'zh-CN': '荣誉馆', 'zh-TW': '榮譽館', 'en': 'Hall of Honor' },
  'shop.subtitle': { 'zh-CN': '用你的社区声望，兑换专属装扮与称号', 'zh-TW': '用你的社區聲望，兌換專屬裝扮與稱號', 'en': 'Exchange your reputation for exclusive items and titles' },
  'sidebar.community': { 'zh-CN': '社区中心', 'zh-TW': '社區中心', 'en': 'Community Hub' },
  'sidebar.checkin': { 'zh-CN': '每日签到', 'zh-TW': '每日簽到', 'en': 'Daily Check-in' },
  'sidebar.top_debaters': { 'zh-CN': '本周最具说服力', 'zh-TW': '本週最具說服力', 'en': 'Most Persuasive' },
  'sidebar.tags': { 'zh-CN': '热门标签', 'zh-TW': '熱門標籤', 'en': 'Hot Tags' },
  'sidebar.active': { 'zh-CN': '今日活跃', 'zh-TW': '今日活躍', 'en': 'Active Today' },
  'sidebar.activity': { 'zh-CN': '实时动态', 'zh-TW': '實時動態', 'en': 'Live Activity' },
  'sidebar.rankings': { 'zh-CN': '查看完整排行榜', 'zh-TW': '查看完整排行榜', 'en': 'Full Rankings' },
  'rankings.title': { 'zh-CN': '排行榜', 'zh-TW': '排行榜', 'en': 'Rankings' },
  'rankings.week': { 'zh-CN': '本周', 'zh-TW': '本週', 'en': 'This Week' },
  'rankings.month': { 'zh-CN': '本月', 'zh-TW': '本月', 'en': 'This Month' },
  'rankings.year': { 'zh-CN': '年度', 'zh-TW': '年度', 'en': 'This Year' },
  'topic.empty': { 'zh-CN': '该分类暂无辩题', 'zh-TW': '該分類暫無辯題', 'en': 'No topics in this category' },
  'topic.hot_section': { 'zh-CN': '今日热点速辩', 'zh-TW': '今日熱點速辯', 'en': 'Hot Debate' },
  'topic.support': { 'zh-CN': '支持', 'zh-TW': '支持', 'en': 'Support' },
  'topic.oppose': { 'zh-CN': '反对', 'zh-TW': '反對', 'en': 'Oppose' },
  'topic.join': { 'zh-CN': '去站队 →', 'zh-TW': '去站隊 →', 'en': 'Pick Side →' },
  'topic.people': { 'zh-CN': '人参与', 'zh-TW': '人參與', 'en': ' participants' },
  'stance.majority': { 'zh-CN': '多数派', 'zh-TW': '多數派', 'en': 'Majority' },
  'stance.minority': { 'zh-CN': '少数派', 'zh-TW': '少數派', 'en': 'Minority' },
  'stance.you_belong_majority': { 'zh-CN': '你属于多数派——当前', 'zh-TW': '你屬於多數派——當前', 'en': 'You are in the majority — ' },
  'stance.you_belong_minority': { 'zh-CN': '你属于少数派——仅', 'zh-TW': '你屬於少數派——僅', 'en': 'You are in the minority — only ' },
  'stance.users_agree': { 'zh-CN': '的用户和你立场一致', 'zh-TW': '的用戶和你立場一致', 'en': ' of users agree with you' },
  'stance.your_voice_matters': { 'zh-CN': '的用户站在你这边，你的观点格外重要', 'zh-TW': '的用戶站在你這邊，你的觀點格外重要', 'en': ' are on your side. Your voice matters.' },
}

// Translation cache for dynamic content
const translateCache = new Map<string, { text: string; lang: Lang }>()

export async function translateText(text: string, targetLang: Lang): Promise<string> {
  if (targetLang === 'zh-CN') return text
  const cacheKey = `${text}|${targetLang}`
  const cached = translateCache.get(cacheKey)
  if (cached) return cached.text

  try {
    // Use Google Translate unofficial API
    const sourceLang = 'auto'
    const targetMap: Record<string, string> = { 'zh-TW': 'zh-TW', 'en': 'en' }
    const tl = targetMap[targetLang] || targetLang

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`
    const res = await fetch(url)
    const data = await res.json()

    let translated = ''
    if (data && data[0]) {
      translated = data[0].map((part: any) => part[0]).join('')
    } else {
      translated = text
    }

    translateCache.set(cacheKey, { text: translated, lang: targetLang })
    return translated
  } catch {
    return text
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('zh-CN')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved && ['zh-CN', 'zh-TW', 'en'].includes(saved)) {
      setLangState(saved)
    }
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
    // Save to profile if logged in
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          supabase.from('profiles').update({ language: l }).eq('id', data.user.id).then(() => {})
        }
      })
    })
  }, [])

  const t = useCallback(async (text: string) => {
    if (lang === 'zh-CN') return text
    return translateText(text, lang)
  }, [lang])

  const tSync = useCallback((key: string) => {
    const entry = UI_STRINGS[key]
    if (!entry) return key
    return entry[lang] || entry['zh-CN']
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t, tSync }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
