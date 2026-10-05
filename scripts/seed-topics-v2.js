const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgresql://postgres:Wkl060816yyds@db.dilacmimmsxosimmkcly.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
})

const NEW_TOPICS = [
  // 科技
  { title: '开源社区最终会取代闭源商业软件', description: '从 Linux 到 Blender，开源软件在各个领域攻城略地。但商业软件仍然占据企业市场主导地位。未来趋势如何？', category: '科技', days: 5 },
  { title: '手机应该每两年换一台还是用到坏', description: '每年新款手机的升级幅度越来越小，但旧手机的性能衰减和安全更新停止也是现实问题。你怎么选？', category: '科技', days: 4 },
  { title: '社交媒体对青少年的影响利大于弊', description: '一方面社交媒体让青少年接触到更广阔的世界，另一方面也带来了焦虑和成瘾问题。', category: '科技', days: 5 },

  // 职场
  { title: '35 岁是程序员的职业终点吗', description: '互联网行业普遍存在年龄焦虑。35岁后的程序员真的没有竞争力了吗？还是这只是特定公司制造的焦虑？', category: '职场', days: 5 },
  { title: '996 工作制应该被法律明确禁止', description: '一些观点认为加班是个人选择和企业竞争力的一部分，另一些观点认为应该从制度层面杜绝。', category: '职场', days: 4 },
  { title: '频繁跳槽比长期在一家公司更有助于职业发展', description: '互联网行业平均在职时间越来越短。每 1-2 年跳一次槽的人，和在一家公司待 5 年以上的人，谁的发展更好？', category: '职场', days: 3 },

  // 生活
  { title: '养宠物对城市年轻人的心理健康有积极影响', description: '越来越多城市独居青年选择养猫养狗。但也有人认为这是在用宠物代替真实的人际关系。', category: '生活', days: 4 },
  { title: '外卖平台让年轻人变得更懒了', description: '外卖和即时配送的便利性无可否认，但这是否也减少了人们的运动量和自理能力？', category: '生活', days: 3 },
  { title: '租房比买房更适合当代年轻人', description: '房价高企的背景下，越来越多人选择长期租房。不买房真的是更理性的选择吗？', category: '生活', days: 5 },

  // 哲学
  { title: '自由意志存在吗', description: '神经科学的发展让我们越来越了解大脑的决策机制。如果我们所有的选择都可以被物理过程解释，自由意志还是真实的吗？', category: '哲学', days: 5 },
  { title: '人生的意义是创造还是体验', description: '有人觉得人生的价值在于创造和留下的东西，有人觉得在于尽可能多地体验这个世界。你更认同哪种？', category: '哲学', days: 4 },
  { title: '技术发展是在让人类更幸福还是在制造新的焦虑', description: '医疗进步、生活便利确实提升了生活质量，但信息过载、社交压力、技术依赖也带来了新的困扰。', category: '哲学', days: 5 },

  // 教育
  { title: '公立学校和私立学校哪个更能培养独立思考能力', description: '不同教育体系的培养目标和方法差异很大。哪种环境更能让学生发展批判性思维？', category: '教育', days: 4 },
  { title: '外语学习应该从小抓起还是等有学习意愿时再学', description: '一些国家从幼儿园开始教英语，另一些则强调母语优先。早期外语教育的利弊如何？', category: '教育', days: 3 },
  { title: '考试成绩应该成为大学录取的唯一标准吗', description: '分数公平但不全面，综合评价更全面但可能不公。教育改革一直在寻找平衡点。', category: '教育', days: 4 },
]

const COMMENTS = [
  { body: '我从 2015 年开始用 Linux 作为主力系统，到现在已经不需要 Windows 了。开源的价值在于透明和可控性——当你知道系统里每一行代码在做什么，那种信任感是闭源永远给不了的。', side: 'for' },
  { body: '理想很丰满，现实是企业用闭源软件不是因为情怀，是因为出了问题有人兜底。开源社区不能说「这是社区版，不提供商业支持」然后让企业自己想办法。', side: 'against' },
  { body: '我在制造企业做 IT，我们的 ERP 系统跑在闭源的 Oracle 上。不是不想开源，是整个行业绑在上面，迁移成本太高。开源要取代闭源，得先解决迁移成本的问题。', side: 'against' },
  { body: '我的 iPhone 12 用了四年，除了电池换过一次，和新机没什么区别。手机厂商每年发布会都在制造焦虑，但实际体验提升已经很小了。', side: 'against' },
  { body: '作为一个科技博主，我每年都换手机。不是因为坏了，是因为新技术确实让我工作更高效。更好的摄像头、更快的芯片、更长的续航——累积起来是质的飞跃。', side: 'for' },
  { body: '我见过太多 35+ 的程序员转行送外卖的案例，也见过 40 岁依然在技术一线写代码、年入百万的架构师。区别不在于年龄，在于你是否一直在学习。', side: 'against' },
  { body: '说实话，我在大厂做招聘，35 岁以上的简历 HR 确实会减分。不是能力问题，是「性价比」和「可塑性」。这就是赤裸裸的现实。', side: 'for' },
  { body: '35 岁不是程序员的终点，但可能是纯执行型程序员的终点。如果你只会照着需求写代码，10 年经验和 3 年经验没有本质区别。但如果你在积累架构思维、业务理解、团队管理能力，35 岁才刚刚开始。', side: 'against' },
  { body: '我在禁止 996 的公司工作两年了。效率没有下降，离职率倒是降了不少。好的管理者应该优化流程而不是堆时间。', side: 'for' },
  { body: '跳槽涨薪确实快。我三年换了四家公司，工资翻了 2.5 倍。但代价是每次都要重新建立信任、重新熟悉业务、重新适应文化。有时候觉得心累。', side: 'for' },
  { body: '我在一家公司待了 7 年。最大的收获不是工资（确实比跳槽慢），而是深度参与了一个产品从零到千万用户的全过程。这种全局视角是频繁跳槽给不了的。', side: 'against' },
  { body: '三年前领养了一只流浪猫。那段时间我正在经历轻度抑郁，它给了我无条件的陪伴和一个每天起床的理由。不是替代人际关系，而是一种完全不同的情感连接。', side: 'for' },
  { body: '租房六年了，很自由。不想住了随时搬家，不用操心维修，省下来的首付钱投资在基金里每年也有稳定收益。买房不是必需品，是过去时代的思维定式。', side: 'for' },
  { body: '租房最大的问题不是钱，是不确定性。房东一句话你就得搬家，想给墙上挂个画都要犹豫。那种「这不是我的家」的感觉，对生活质量的影响是实实在在的。', side: 'against' },
  { body: '关于自由意志，我最近读了一本神经科学的书，里面提到：大脑在「你」意识到做决定之前，已经做出了决定。这个发现让人很不舒服。', side: 'for' },
  { body: '即使我们的决策有物理基础，也不能否定自由意志。就像一首歌可以还原为声波，但音乐的意义超越了物理。意识层面的自由意志是真实的体验。', side: 'against' },
  { body: '我在农村小学支教过两年。那里的孩子和城市孩子最大的差距不是知识，是思维方式。公立教育在资源分配上确实不公平。', side: 'against' },
  { body: '我们公司公开了所有职位的薪资范围。结果招聘效率提升了，员工流失率下降了——信息透明比任何管理制度都有效。同理，分数透明比不透明的「综合素质评价」更公平。', side: 'for' },
]

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }

async function main() {
  // Ensure category column exists
  try { await pool.query("ALTER TABLE topics ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '科技'") } catch {}

  // Update existing topics with categories if null
  const existingCategories = ['科技', '科技', '职场', '生活', '科技']
  const { rows: existing } = await pool.query('SELECT id, title FROM topics ORDER BY created_at')
  for (let i = 0; i < existing.length; i++) {
    const idx = Math.min(i, existingCategories.length - 1)
    await pool.query('UPDATE topics SET category = $1 WHERE id = $2', [existingCategories[idx], existing[i].id])
  }

  // Insert new topics
  const now = new Date()
  for (const t of NEW_TOPICS) {
    const endsAt = new Date(now.getTime() + t.days * 24 * 60 * 60 * 1000)
    await pool.query(
      `INSERT INTO topics (title, description, category, status, starts_at, ends_at) VALUES ($1, $2, $3, 'active', $4, $5)`,
      [t.title, t.description, t.category, now.toISOString(), endsAt.toISOString()]
    )
    console.log(`✅ [${t.category}] ${t.title}`)
  }

  // Add comments to all active topics
  const { rows: profiles } = await pool.query('SELECT id, username FROM profiles WHERE email != $1', ['namelesss689@gmail.com'])
  const { rows: allTopics } = await pool.query("SELECT id, title FROM topics WHERE status = 'active' ORDER BY created_at")

  for (const topic of allTopics) {
    const { rows: existingComments } = await pool.query('SELECT COUNT(*) as cnt FROM comments WHERE topic_id = $1', [topic.id])
    if (parseInt(existingComments[0].cnt) > 5) continue // Skip topics that already have comments

    const shuffledUsers = shuffle(profiles).slice(0, 6)
    const shuffledComments = shuffle(COMMENTS).slice(0, shuffledUsers.length)
    for (let ci = 0; ci < shuffledComments.length; ci++) {
      await pool.query(
        'INSERT INTO comments (topic_id, user_id, body, side_at_time, upvote_count) VALUES ($1, $2, $3, $4, $5)',
        [topic.id, shuffledUsers[ci].id, shuffledComments[ci].body, shuffledComments[ci].side, randInt(3, 40)]
      )
    }
    console.log(`💬 ${topic.title.substring(0, 20)}... +${shuffledComments.length} comments`)
  }

  console.log(`\n🎉 Done! ${NEW_TOPICS.length} new topics + comments added`)
  await pool.end()
}

main().catch(e => { console.error('❌', e.message); pool.end() })
