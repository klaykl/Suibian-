const { Pool } = require('pg')

const pool = new Pool({
  connectionString:
    'postgresql://postgres:Wkl060816yyds@db.dilacmimmsxosimmkcly.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
})

const topics = [
  {
    title: 'AI 会在 5 年内取代初级程序员吗？',
    description: '随着 Claude、Cursor、Copilot 等 AI 编程工具的快速进步，初级程序员的岗位是否会被大幅缩减？请基于你的实际经验和观察发表观点。',
    days: 3,
  },
  {
    title: '大学文凭的性价比已经低于自学',
    description: '大学学费持续上涨，而在线课程、开源资源越来越丰富。对于进入科技行业而言，自学是否比读大学更划算？',
    days: 3,
  },
  {
    title: '远程工作效率高于办公室',
    description: '疫情后远程办公普及，支持者和反对者各执一词。你基于真实体验怎么看？',
    days: 3,
  },
  {
    title: '30 岁前应该优先存钱而不是花钱体验',
    description: '一种观点认为年轻时应该多存钱利用复利效应，另一种认为有些体验只有年轻时才能享受。你的立场？',
    days: 3,
  },
  {
    title: '互联网让人们的观点更极端而不是更开放',
    description: '推荐算法和回音室效应是否让我们变得更加固执？还是互联网让更多不同观点得以传播？',
    days: 3,
  },
]

async function main() {
  const now = new Date()

  for (const t of topics) {
    const endsAt = new Date(now.getTime() + t.days * 24 * 60 * 60 * 1000)

    await pool.query(
      `INSERT INTO topics (title, description, status, starts_at, ends_at)
       VALUES ($1, $2, 'active', $3, $4)`,
      [t.title, t.description, now.toISOString(), endsAt.toISOString()]
    )
    console.log(`✅ "${t.title}"`)
  }

  console.log(`\n🎉 ${topics.length} 个种子话题已创建！`)
  await pool.end()
}

main().catch((err) => {
  console.error('❌ Failed:', err.message)
  process.exit(1)
})
