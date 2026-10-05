import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: '邮箱不能为空' }, { status: 400 })

    const supabase = await createClient()

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    // Try to use Supabase's built-in email (may send a link, not the code)
    // For now, store the code and return it (will be sent via custom SMTP when configured)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { verification_code: code },
      },
    })

    // Also store code directly in profiles for verification
    // Find or create profile by email approach
    const { data: existingUser } = await supabase.auth.admin?.listUsers()
    // Fallback: just return the code for now (MVP - will be replaced with proper email sending)

    return NextResponse.json({
      success: true,
      code: code, // TEMPORARY: return code for MVP testing
      message: '验证码已发送',
      expiresAt: expiresAt.toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
