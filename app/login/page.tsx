'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('帳號或密碼錯誤，請再試一次 💦')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">💕</div>
          <h1 className="text-3xl font-bold text-pink-600">男友積分本</h1>
          <p className="text-pink-400 mt-1 text-sm">記錄每一個甜蜜時刻 🌸</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-pink-700 mb-1">
              電子信箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition text-sm"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pink-700 mb-1">
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-50 rounded-xl py-2 px-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '登入中...' : '登入 💖'}
          </button>
        </form>

        <p className="text-center text-xs text-pink-300 mt-4">
          帳號由女友設定 🌷
        </p>
      </div>
    </div>
  )
}
