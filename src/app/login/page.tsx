import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <div className="text-center mb-8">
        <h1 className="text-[22px] font-bold text-gray-900 mb-1">欢迎回来</h1>
        <p className="text-sm text-gray-500">登录后继续你的辩论</p>
      </div>
      <div className="bg-white rounded-md border border-gray-100 p-6">
        <AuthForm mode="login" />
      </div>
      <p className="text-center text-sm text-gray-500 mt-6">
        还没有账号？<Link href="/register" className="text-zhihu-blue font-medium hover:underline">注册</Link>
      </p>
    </div>
  )
}
