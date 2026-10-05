import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { NavBar } from '@/components/NavBar'
import { LangProvider } from '@/lib/language'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: '随辩 — 用辩论改变观点',
  description: '一个以辩论为核心的社区。选择正反方，发表观点，随时改变立场。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LangProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
          <footer className="py-8 text-center text-xs text-gray-400">随辩 · 用辩论改变观点</footer>
          <Toaster position="top-center" toastOptions={{ duration: 2000 }} />
        </LangProvider>
      </body>
    </html>
  )
}
