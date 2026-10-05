const { createClient } = require('@supabase/supabase-js')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const NAMES = [
  'Jack', 'Ethan', 'Mason', 'Logan', 'Caleb', 'Owen', 'Luke', 'Nathan', 'Dylan', 'Isaac',
  'Ava', 'Mia', 'Ella', 'Aria', 'Nora', 'Zoe', 'Lily', 'Chloe', 'Grace', 'Lucy',
  'Leo', 'Max', 'Sam', 'Ben', 'Tom', 'Kai', 'Finn', 'Jake', 'Cole', 'Zack',
  'Ruby', 'Ivy', 'Nova', 'Luna', 'Wren', 'Hazel', 'Vera', 'June', 'Pearl', 'Rose',
  'Theo', 'Hugo', 'Axel', 'Jude', 'Wade', 'Dean', 'Seth', 'Troy', 'Rex', 'Jett',
  'Isla', 'Eden', 'Iris', 'Cora', 'Maya', 'Elsa', 'Faye', 'Hope', 'Jade', 'Sage',
  'Ryder', 'Knox', 'Zane', 'Drew', 'Reid', 'Shane', 'Brett', 'Todd', 'Chase', 'Grant',
  'Riley', 'Quinn', 'Blake', 'Casey', 'Jamie', 'Dakota', 'Jules', 'River', 'Sage', 'Emery',
  'Ash', 'Sky', 'Kai', 'Remi', 'Ellis', 'Finley', 'Rowan', 'Avery', 'Morgan', 'Cameron',
]

async function main() {
  // Get existing users to skip duplicates
  const { data: existing } = await supabase.auth.admin.listUsers()
  const existingEmails = new Set(existing.users.map(u => u.email))
  console.log(`已有 ${existingEmails.size} 个用户`)

  let created = 0
  for (let i = 0; i < NAMES.length; i++) {
    const name = NAMES[i]
    const email = `${name.toLowerCase()}.seed${i}@seed.local`

    if (existingEmails.has(email)) {
      console.log(`  ⏭  ${name} (已存在)`)
      continue
    }

    const { error } = await supabase.auth.admin.createUser({
      email,
      password: 'SeedPass123!',
      email_confirm: true,
      user_metadata: { username: name },
    })

    if (error) {
      console.error(`  ❌ ${name}: ${error.message}`)
    } else {
      created++
      if (created % 20 === 0) console.log(`  ...已创建 ${created}/${NAMES.length}`)
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`\n✅ 新增 ${created} 个用户`)
}

main().catch(e => console.error(e.message))
