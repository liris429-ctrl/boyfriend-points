'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavbarProps {
  role: 'admin' | 'user'
  displayName: string
  pendingCount?: number
}

export default function Navbar({ role, displayName, pendingCount }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  type NavLink = { href: string; label: string; emoji: string; badge: number }

  const userLinks: NavLink[] = [
    { href: '/', label: '首頁', emoji: '🏠', badge: 0 },
    { href: '/rewards', label: '獎勵', emoji: '🎁', badge: 0 },
    { href: '/history', label: '紀錄', emoji: '📋', badge: 0 },
  ]

  const adminLinks: NavLink[] = [
    { href: '/admin', label: '給分', emoji: '⭐', badge: 0 },
    { href: '/admin/review', label: '審核', emoji: '📋', badge: pendingCount ?? 0 },
    { href: '/admin/actions', label: '積分', emoji: '📝', badge: 0 },
    { href: '/admin/rewards', label: '獎勵', emoji: '🎁', badge: 0 },
    { href: '/history', label: '紀錄', emoji: '📊', badge: 0 },
  ]

  const links = role === 'admin' ? adminLinks : userLinks

  return (
    <nav className="bg-white border-b border-pink-100 sticky top-0 z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href={role === 'admin' ? '/admin' : '/'} className="flex items-center gap-1.5 shrink-0">
            <span className="text-xl">💕</span>
            <span className="font-bold text-pink-600 text-sm">男友積分本</span>
          </Link>

          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex flex-col items-center px-2 py-1 rounded-lg text-xs transition-colors shrink-0 ${
                  pathname === link.href
                    ? 'bg-pink-100 text-pink-600 font-semibold'
                    : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50'
                }`}
              >
                <span className="relative">
                  {link.emoji}
                  {link.badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 leading-none">
                      {link.badge > 9 ? '9+' : link.badge}
                    </span>
                  )}
                </span>
                <span>{link.label}</span>
              </Link>
            ))}

            <button
              onClick={handleSignOut}
              className="flex flex-col items-center px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
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
