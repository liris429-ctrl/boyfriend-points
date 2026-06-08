'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useEffect } from 'react'

interface NavbarProps {
  role: 'admin' | 'user'
  displayName: string
  pendingCount?: number
}

export default function Navbar({ role, displayName, pendingCount }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [menuOpen])

  type NavLink = { href: string; label: string; emoji: string; badge: number }

  const userLinks: NavLink[] = [
    { href: '/', label: '首頁', emoji: '🏠', badge: 0 },
    { href: '/rewards', label: '獎勵', emoji: '🎁', badge: 0 },
    { href: '/messages', label: '留言', emoji: '💬', badge: 0 },
    { href: '/history', label: '紀錄', emoji: '📋', badge: 0 },
  ]

  const adminPrimary: NavLink[] = [
    { href: '/admin', label: '給分', emoji: '⭐', badge: 0 },
    { href: '/admin/review', label: '審核', emoji: '📋', badge: pendingCount ?? 0 },
  ]

  const adminMore: NavLink[] = [
    { href: '/admin/actions', label: '積分項目', emoji: '📝', badge: 0 },
    { href: '/admin/rewards', label: '獎勵項目', emoji: '🎁', badge: 0 },
    { href: '/admin/special-dates', label: '紀念日', emoji: '🎊', badge: 0 },
    { href: '/admin/marquee', label: '跑馬燈', emoji: '📢', badge: 0 },
  ]

  const isMoreActive = role === 'admin' && adminMore.some((l) => l.href === pathname)
  const links = role === 'admin' ? adminPrimary : userLinks

  return (
    <nav className="bg-white border-b border-pink-100 sticky top-0 z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href={role === 'admin' ? '/admin' : '/'} className="flex items-center gap-1.5 shrink-0">
            <span className="text-xl">💕</span>
            <span className="font-bold text-pink-600 text-sm">男友積分本</span>
          </Link>

          <div className="flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex flex-col items-center px-3 py-1 rounded-lg text-xs transition-colors shrink-0 ${
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

            {role === 'admin' ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className={`flex flex-col items-center px-3 py-1 rounded-lg text-xs transition-colors shrink-0 ${
                    isMoreActive || menuOpen
                      ? 'bg-pink-100 text-pink-600 font-semibold'
                      : 'text-gray-500 hover:text-pink-500 hover:bg-pink-50'
                  }`}
                >
                  <span>≡</span>
                  <span>選單</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-[3.2rem] bg-white rounded-2xl shadow-xl border border-pink-100 py-2 w-40 z-50">
                    {adminMore.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                          pathname === link.href
                            ? 'bg-pink-50 text-pink-600 font-semibold'
                            : 'text-gray-600 hover:bg-pink-50 hover:text-pink-500'
                        }`}
                      >
                        <span>{link.emoji}</span>
                        <span>{link.label}</span>
                      </Link>
                    ))}
                    <div className="border-t border-pink-100 mt-1 pt-1">
                      <button
                        onClick={() => { setMenuOpen(false); handleSignOut() }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors"
                      >
                        <span>👋</span>
                        <span>登出</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignOut}
                className="flex flex-col items-center px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
              >
                <span>👋</span>
                <span>登出</span>
              </button>
            )}
          </div>
        </div>

        <div className="pb-1 -mt-1 text-xs text-pink-300 text-right">
          {role === 'admin' ? '👑 管理員' : '💙'} {displayName}
        </div>
      </div>
    </nav>
  )
}
