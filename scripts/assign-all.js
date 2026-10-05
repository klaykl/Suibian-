const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgresql://postgres:Wkl060816yyds@db.dilacmimmsxosimmkcly.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
})

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function main() {
  // Get all profiles
  const { rows: profiles } = await pool.query('SELECT id, username FROM profiles')
  console.log(`共 ${profiles.length} 个用户`)

  // Get active topics
  const { rows: topics } = await pool.query(
    "SELECT id, title FROM topics WHERE status = 'active' ORDER BY created_at"
  )

  // Clear existing affiliations (keep admin's if needed)
  // Actually, clear all non-admin and re-assign
  const adminId = '0afa1c35-f4dd-4035-a530-1d72a5c14b99'
  await pool.query('DELETE FROM affiliation_changes')
  await pool.query('DELETE FROM affiliations WHERE user_id != $1', [adminId])
  console.log('已清除旧数据，重新分配')

  for (const topic of topics) {
    const nonAdmin = profiles.filter(p => p.id !== adminId)
    const n = nonAdmin.length // ~100

    // 50/50 split with slight random variation
    const half = Math.floor(n / 2)
    const shuffled = shuffle(nonAdmin)
    const forUsers = shuffled.slice(0, half)
    const againstUsers = shuffled.slice(half)

    for (const u of forUsers) {
      await pool.query(
        `INSERT INTO affiliations (user_id, topic_id, side) VALUES ($1, $2, 'for')
         ON CONFLICT (user_id, topic_id) DO NOTHING`,
        [u.id, topic.id]
      )
    }
    for (const u of againstUsers) {
      await pool.query(
        `INSERT INTO affiliations (user_id, topic_id, side) VALUES ($1, $2, 'against')
         ON CONFLICT (user_id, topic_id) DO NOTHING`,
        [u.id, topic.id]
      )
    }

    // Add some switches (5-10 random users)
    const switchers = shuffle(nonAdmin).slice(0, 5 + Math.floor(Math.random() * 6))
    for (const u of switchers) {
      const fromSide = Math.random() > 0.5 ? 'for' : 'against'
      const toSide = fromSide === 'for' ? 'against' : 'for'

      const { rows: aff } = await pool.query(
        'SELECT id FROM affiliations WHERE user_id = $1 AND topic_id = $2',
        [u.id, topic.id]
      )
      if (aff.length === 0) continue

      await pool.query(
        `INSERT INTO affiliation_changes (affiliation_id, user_id, topic_id, from_side, to_side)
         VALUES ($1, $2, $3, $4, $5)`,
        [aff[0].id, u.id, topic.id, fromSide, toSide]
      )
      await pool.query(
        `UPDATE affiliations SET changed_at = NOW(), side = $1 WHERE id = $2`,
        [toSide, aff[0].id]
      )
    }

    // Count actual
    const { rows: counts } = await pool.query(
      `SELECT side, COUNT(*) FROM affiliations WHERE topic_id = $1 GROUP BY side`,
      [topic.id]
    )
    const forCnt = counts.find(c => c.side === 'for')?.count || 0
    const againstCnt = counts.find(c => c.side === 'against')?.count || 0

    console.log(`✅ ${topic.title.substring(0, 20)}... | 正方:${forCnt} 反方:${againstCnt} | ${switchers.length}人换阵营`)
  }

  console.log('\n🎉 分配完成！')
  await pool.end()
}

main().catch(e => { console.error(e.message); process.exit(1) })
