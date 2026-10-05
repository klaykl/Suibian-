const { createClient } = require('@supabase/supabase-js')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  // 1. Get existing user
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) { console.error('List users failed:', listErr.message); return }

  console.log(`Found ${users.length} user(s):`)
  for (const u of users) {
    console.log(`  ${u.email} | confirmed: ${!!u.email_confirmed_at} | id: ${u.id.substring(0, 8)}...`)
  }

  // 2. Confirm the user
  const unconfirmed = users.filter(u => !u.email_confirmed_at)
  for (const u of unconfirmed) {
    const { error } = await supabase.auth.admin.updateUserById(u.id, {
      email_confirm: true,
    })
    if (error) {
      console.error(`❌ Failed to confirm ${u.email}:`, error.message)
    } else {
      console.log(`✅ Email confirmed for ${u.email}`)
    }
  }

  // 3. Also update auth settings to disable email confirmation for future users
  // This requires calling the Supabase API directly
  const projectRef = process.env.SUPABASE_PROJECT_REF
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mailer_autoconfirm: true,
    }),
  })

  if (res.ok) {
    console.log('✅ 已关闭邮箱验证要求（新用户无需验证）')
  } else {
    const body = await res.text()
    console.log('⚠️  关闭邮箱验证失败（可能需要管理后台手动关闭）:', body.substring(0, 100))
  }

  console.log('\n现在可以登录了！')
}

main().catch(e => console.error(e.message))
