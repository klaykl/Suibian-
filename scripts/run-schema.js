const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString:
    'postgresql://postgres:Wkl060816yyds@db.dilacmimmsxosimmkcly.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
})

async function main() {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'supabase-schema.sql'),
    'utf8'
  )

  console.log('Running schema...')
  await pool.query(sql)
  console.log('✅ Schema applied successfully!')
  await pool.end()
}

main().catch((err) => {
  console.error('❌ Failed:', err.message)
  process.exit(1)
})
