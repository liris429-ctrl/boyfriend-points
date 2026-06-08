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

  // ── User role: thin top bar + fixed bottom tab bar ──────────────────────
  if (role !== 'admin') {
    const userTabs = [
      { href: '/', label: '首頁', emoji: '🏠' },
      { href: '/rewards', label: '獎勵', emoji: '🎁' },
      { href: '/messages', label: '留言', emoji: '💬' },
      { href: '/history', label: '紀錄', emoji: '📋' },
    ]

    return (
      <>
        <header className="bg-white border-b border-pink-100 sticky top-0 z-40">
          <div className="max-w-lg mx-auto px-4 flex items-center justify-between h-11">
            <span className="font-bold text-pink-600 text-sm flex items-center gap-1.5">
              <span>💕</span>男友積分本
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-pink-300">💙 {displayName}</span>
              <button
                onClick={handleSignOut}
                className="text-xs text-gray-400 hover:text-red-400 transition"
              >
                登出
              </button>
            </div>
          </div>
        </header>

        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-pink-100">
          <div className="max-w-lg mx-auto grid grid-cols-4 h-16">
            {userTabs.map((tab) => {
              const active = pathname === tab.href
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    active ? 'text-pink-600' : 'text-gray-400'
                  }`}
                >
                  <span className="text-2xl leading-none">{tab.emoji}</span>
                  <span className={`text-[10px] ${active ? 'font-semibold' : ''}`}>{tab.label}</span>
                  {active && (
                    <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-pink-500" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      </>
    )
  }

  // ── Admin role: top nav with dropdown ────────────────────────────────────
  type NavLink = { href: string; label: string; emoji: string; badge: number }

  const adminPrimary: NavLink[] = [
    { href: '/admin', label: '給分', emoji: '⭐', badge: 0 },
    { href: '/admin/review', label: '審核', emoji: '📋', badge: pendingCount ?? 0 },
  ]

  const adminMore: NavLink[] = [
    { href: '/messages', label: '留言板', emoji: '💬', badge: 0 },
    { href: '/admin/actions', label: '積分項目', emoji: '📝', badge: 0 },
    { href: '/admin/rewards', label: '獎勵項目', emoji: '🎁', badge: 0 },
    { href: '/admin/special-dates', label: '紀念日', emoji: '🎊', badge: 0 },
    { href: '/admin/marquee', label: '跑馬燈', emoji: '📢', badge: 0 },
  ]

  const isMoreActive = adminMore.some((l) => l.href === pathname)

  return (
    <nav className="bg-white border-b border-pink-100 sticky top-0 z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/admin" className="flex items-center gap-1.5 shrink-0">
            <span className="text-xl">💕</span>
            <span className="font-bold text-pink-600 text-sm">男友積分本</span>
          </Link>

          <div className="flex items-center gap-0.5">
            {adminPrimary.map((link) => (
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
          </div>
        </div>

        <div className="pb-1 -mt-1 text-xs text-pink-300 text-right">
          👑 管理員 {displayName}
        </div>
      </div>
    </nav>
  )
}
