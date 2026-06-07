'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavbarProps {
  role: 'admin' | 'user'
  displayName: string
}

export default function Navbar({ role, displayName }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const userLinks = [
    { href: '/', label: '首頁', emoji: '🏠' },
    { href: '/rewards', label: '獎勵商城', emoji: '🎁' },
    { href: '/history', label: '積分紀錄', emoji: '📋' },
  ]

  const adminLinks = [
    { href: '/admin', label: '給分', emoji: '⭐' },
    { href: '/admin/actions', label: '積分項目', emoji: '📝' },
    { href: '/admin/rewards', label: '獎勵項目', emoji: '🎁' },
    { href: '/history', label: '紀錄', emoji: '📋' },
  ]

  const links = role === 'admin' ? adminLinks : userLinks

  return (
    <nav className="bg-white border-b border-pink-100 sticky top-0 z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href={role === 'admin' ? '/admin' : '/'} className="flex items-center gap-1.5">
            <span className="text-xl">💕</span>
            <span className="font-bold text-pink-600 text-sm">男友積分本</span>
          </Link>

          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center px-2 py-1 rounded-lg text-xs transition-colors ${
                  pathname === link.href
                    ? 'bg-pink-100 text-pink-600 font-semibold'
                    : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50'
                }`}
              >
                <span>{link.emoji}</span>
                <span>{link.label}</span>
              </Link>
            ))}

            <button
              onClick={handleSignOut}
              className="flex flex-col items-center px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors"
            >
              <span>👋</span>
              <span>登出</span>
            </button>
          </div>
        </div>

        <div className="pb-1 -mt-1 text-xs text-pink-300 text-right">
          {role === 'admin' ? '👑 管理員' : '💙'} {displayName}
        </div>
      </div>
    </nav>
  )
}
