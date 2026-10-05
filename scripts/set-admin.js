const { Pool } = require('pg')

const pool = new Pool({
  connectionString:
    'postgresql://postgres:Wkl060816yyds@db.dilacmimmsxosimmkcly.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
})

async function main() {
  // List all users
  const { rows: users } = await pool.query(
    'SELECT id, username, email, is_admin, created_at FROM profiles ORDER BY created_at DESC'
  )
  console.log('=== 当前用户 ===')
  users.forEach((u) => console.log(`  ${u.username} | ${u.email} | admin:${u.is_admin}`))

  if (users.length === 0) {
    console.log('⚠️ 还没有用户注册')
    await pool.end()
    return
  }

  // Set first user as admin
  const firstUser = users[0]
  if (!firstUser.is_admin) {
    await pool.query('UPDATE profiles SET is_admin = true WHERE id = $1', [firstUser.id])
    console.log(`\n✅ 已将 ${firstUser.email} 设为管理员`)
  } else {
    console.log(`\n✅ ${firstUser.email} 已经是管理员`)
  }

  // Also set admin in user metadata via auth.users
  await pool.query(
    `UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb WHERE id = $1`,
    [firstUser.id]
  )
  console.log('✅ 已更新 auth 元数据')

  // List topics with IDs
  const { rows: topics } = await pool.query('SELECT id, title FROM topics ORDER BY created_at')
  console.log('\n=== 话题列表 ===')
  topics.forEach((t) => console.log(`  ${t.id.substring(0, 8)}... | ${t.title}`))

  await pool.end()
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
