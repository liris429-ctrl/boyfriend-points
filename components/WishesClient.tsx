'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RewardWish } from '@/lib/types'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: '審核中', color: 'text-amber-500 bg-amber-50 border-amber-200' },
  approved: { label: '已核准', color: 'text-green-600 bg-green-50 border-green-200' },
  rejected: { label: '未通過', color: 'text-gray-400 bg-gray-50 border-gray-200' },
}

interface Props {
  wishes: RewardWish[]
  userId: string
}

export default function WishesClient({ wishes, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setErrorMsg(null)

    const { error } = await supabase.from('reward_wishes').insert({
      user_id: userId,
      title: title.trim(),
      emoji: emoji.trim() || '✨',
      reason: reason.trim() || null,
    })

    setLoading(false)
    if (error) {
      setErrorMsg(error.message)
      return
    }
    setSubmitted(true)
    setTitle('')
    setEmoji('')
    setReason('')
    setTimeout(() => {
      setSubmitted(false)
      router.refresh()
    }, 1500)
  }

  return (
    <div className="space-y-5">
      {/* Submit form */}
      <div className="bg-white rounded-2xl border border-pink-100 p-4">
        <h2 className="font-semibold text-pink-700 mb-3 flex items-center gap-1.5">
          <span>✨</span> 許一個新心願
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <div className="w-16">
              <label className="block text-xs text-pink-400 mb-1">表情</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={2}
                className="w-full px-2 py-2 rounded-xl border border-pink-200 text-center text-lg focus:outline-none focus:border-pink-400"
                placeholder="✨"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-pink-400 mb-1">想要的獎勵名稱 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={30}
                required
                className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
                placeholder="例：陪我看一部電影"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-pink-400 mb-1">理由（選填）</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={80}
              className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
              placeholder="我覺得這個應該可以變成獎勵..."
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5">
              <p className="text-red-500 text-xs font-medium">❌ 送出失敗：{errorMsg}</p>
            </div>
          )}

          {submitted && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 text-center">
              <p className="text-green-600 text-sm font-medium">✅ 心願送出！等女友審核</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!title.trim() || loading || submitted}
            className="w-full py-2.5 rounded-xl bg-pink-500 text-white font-semibold text-sm hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '送出中...' : '許願 ✨'}
          </button>
        </form>
      </div>

      {/* Wish list */}
      <div>
        <h2 className="font-semibold text-pink-700 mb-3 flex items-center gap-1.5">
          <span>📜</span> 我的心願清單
        </h2>

        {wishes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center text-pink-300">
            <div className="text-4xl mb-2">🌸</div>
            <p className="text-sm">還沒有許願紀錄</p>
          </div>
        ) : (
          <div className="space-y-2">
            {wishes.map((w) => {
              const st = STATUS_LABEL[w.status] ?? STATUS_LABEL.pending
              return (
                <div key={w.id} className="bg-white rounded-2xl border border-pink-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-0.5">{w.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-gray-700">{w.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      {w.reason && <p className="text-xs text-gray-400 mt-0.5">{w.reason}</p>}
                      {w.admin_reply && (
                        <p className="text-xs text-pink-500 mt-1 italic">💬 {w.admin_reply}</p>
                      )}
                      <p className="text-xs text-pink-300 mt-1">
                        {new Date(w.created_at).toLocaleDateString('zh-TW', {
                          timeZone: 'Asia/Taipei', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
