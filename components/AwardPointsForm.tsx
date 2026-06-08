'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PointAction, Profile, SpecialDate } from '@/lib/types'

interface Props {
  actions: PointAction[]
  users: Profile[]
  adminId: string
  specialDates?: SpecialDate[]
}

interface ShareResult {
  userName: string
  points: number
  actionEmoji: string
  actionTitle: string
  message: string
}

interface DeductResult {
  userName: string
  amount: number
  reason: string
}

function getTodaySpecialDate(dates: SpecialDate[] = []) {
  const today = new Date()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayFull = today.toISOString().split('T')[0]
  return dates.find((d) => {
    const dObj = new Date(d.date + 'T00:00:00')
    const dMM = String(dObj.getMonth() + 1).padStart(2, '0')
    const dDD = String(dObj.getDate()).padStart(2, '0')
    return d.repeat_yearly ? (dMM === mm && dDD === dd) : d.date === todayFull
  }) ?? null
}

export default function AwardPointsForm({ actions, users, adminId, specialDates }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const todaySpecial = getTodaySpecialDate(specialDates)

  const [mode, setMode] = useState<'award' | 'deduct'>('award')

  // Award mode
  const [selectedAction, setSelectedAction] = useState<PointAction | null>(null)
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? '')
  const [message, setMessage] = useState('')

  // Deduct mode
  const [deductAmount, setDeductAmount] = useState('')
  const [deductReason, setDeductReason] = useState('')
  const [deductResult, setDeductResult] = useState<DeductResult | null>(null)

  const [loading, setLoading] = useState(false)
  const [shareResult, setShareResult] = useState<ShareResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [deductCopied, setDeductCopied] = useState(false)

  const selectedUser = users.find((u) => u.id === selectedUserId)

  async function handleAward(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAction || !selectedUserId) return
    setLoading(true)

    const multiplier = todaySpecial ? todaySpecial.bonus_multiplier : 1
    const finalPoints = Math.round(selectedAction.points * multiplier)

    const { error } = await supabase.from('point_transactions').insert({
      user_id: selectedUserId,
      action_id: selectedAction.id,
      points: finalPoints,
      note: message.trim() || null,
      awarded_by: adminId,
    })

    setLoading(false)
    if (!error) {
      setShareResult({
        userName: selectedUser?.display_name ?? '男友',
        points: finalPoints,
        actionEmoji: selectedAction.emoji,
        actionTitle: selectedAction.title,
        message: message.trim(),
      })
      setMessage('')
      setSelectedAction(null)
      router.refresh()
    }
  }

  async function handleDeduct(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseInt(deductAmount)
    if (!amount || amount <= 0 || !deductReason.trim() || !selectedUserId) return
    setLoading(true)

    const { error } = await supabase.from('point_transactions').insert({
      user_id: selectedUserId,
      action_id: null,
      points: -amount,
      note: deductReason.trim(),
      awarded_by: adminId,
    })

    setLoading(false)
    if (!error) {
      setDeductResult({
        userName: selectedUser?.display_name ?? '男友',
        amount,
        reason: deductReason.trim(),
      })
      setDeductAmount('')
      setDeductReason('')
      router.refresh()
    }
  }

  function buildShareText() {
    if (!shareResult) return ''
    const lines = [
      `💕 ${shareResult.userName} 獲得了 +${shareResult.points} 積分！`,
      `事件：${shareResult.actionEmoji} ${shareResult.actionTitle}`,
    ]
    if (shareResult.message) lines.push(`留言：${shareResult.message}`)
    lines.push(`快來登入查看積分餘額 👀`)
    return lines.join('\n')
  }

  async function copyShareText() {
    await navigator.clipboard.writeText(buildShareText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function buildDeductText() {
    if (!deductResult) return ''
    return [
      `📉 ${deductResult.userName} 被扣了 ${deductResult.amount} 分`,
      `原因：${deductResult.reason}`,
      `快來登入看看餘額吧！`,
      `要乖一點喔 💕`,
    ].join('\n')
  }

  async function copyDeductText() {
    await navigator.clipboard.writeText(buildDeductText())
    setDeductCopied(true)
    setTimeout(() => setDeductCopied(false), 2500)
  }

  return (
    <>
      {/* Share modal after awarding */}
      {shareResult && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-xl">
            <div className="text-5xl mb-2">🎉</div>
            <h3 className="font-bold text-gray-700 text-lg">給分成功！</h3>
            <p className="text-pink-500 mt-1">
              +{shareResult.points} 分 → {shareResult.userName}
            </p>

            <div className="mt-4 bg-pink-50 rounded-2xl p-3 text-left">
              <p className="text-xs text-pink-500 font-medium mb-2">📋 複製以下文字傳給男友：</p>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-5">
                {buildShareText()}
              </pre>
            </div>

            <button
              onClick={copyShareText}
              className={`w-full mt-3 py-2.5 rounded-xl font-semibold text-sm transition ${
                copied ? 'bg-green-500 text-white' : 'bg-pink-500 text-white hover:bg-pink-600'
              }`}
            >
              {copied ? '✅ 已複製！' : '複製文字'}
            </button>

            <button
              onClick={() => { setShareResult(null); setCopied(false) }}
              className="w-full mt-2 py-2 rounded-xl border border-pink-200 text-pink-500 text-sm hover:bg-pink-50 transition"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Deduct notification modal */}
      {deductResult && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-xl">
            <div className="text-5xl mb-2">📉</div>
            <h3 className="font-bold text-gray-700 text-lg">已扣除積分</h3>
            <p className="text-rose-500 mt-1">
              −{deductResult.amount} 分 → {deductResult.userName}
            </p>

            <div className="mt-4 bg-rose-50 rounded-2xl p-3 text-left">
              <p className="text-xs text-rose-500 font-medium mb-2">📋 複製以下文字通知男友：</p>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-5">
                {buildDeductText()}
              </pre>
            </div>

            <button
              onClick={copyDeductText}
              className={`w-full mt-3 py-2.5 rounded-xl font-semibold text-sm transition ${
                deductCopied ? 'bg-green-500 text-white' : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
            >
              {deductCopied ? '✅ 已複製！' : '複製文字'}
            </button>

            <button
              onClick={() => { setDeductResult(null); setDeductCopied(false) }}
              className="w-full mt-2 py-2 rounded-xl border border-rose-200 text-rose-500 text-sm hover:bg-rose-50 transition"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-pink-100 overflow-hidden">
        {/* Mode tabs */}
        <div className="flex border-b border-pink-100">
          <button
            type="button"
            onClick={() => setMode('award')}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              mode === 'award'
                ? 'text-pink-600 bg-pink-50 border-b-2 border-pink-500'
                : 'text-gray-400 hover:text-pink-400'
            }`}
          >
            💕 給分
          </button>
          <button
            type="button"
            onClick={() => setMode('deduct')}
            className={`flex-1 py-3 text-sm font-semibold transition ${
              mode === 'deduct'
                ? 'text-rose-600 bg-rose-50 border-b-2 border-rose-500'
                : 'text-gray-400 hover:text-rose-400'
            }`}
          >
            📉 扣點
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Shared: user selector */}
          {users.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">對象</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.display_name}</option>
                ))}
              </select>
            </div>
          )}

          {todaySpecial && mode === 'award' && (
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 -mt-1 mb-1">
              <span className="text-xl">{todaySpecial.emoji}</span>
              <div>
                <p className="text-xs font-semibold text-rose-600">🎊 今天是{todaySpecial.name}！</p>
                <p className="text-xs text-rose-400">積分自動 ×{todaySpecial.bonus_multiplier} 倍</p>
              </div>
            </div>
          )}

          {mode === 'award' ? (
            <form onSubmit={handleAward} className="space-y-4">
              {actions.length === 0 ? (
                <p className="text-sm text-pink-300 text-center py-4">
                  還沒有積分項目，請先到「積分」頁新增
                </p>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-pink-700 mb-2">選擇好事 ✨</label>
                  <div className="grid grid-cols-2 gap-2">
                    {actions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => setSelectedAction(action)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                          selectedAction?.id === action.id
                            ? 'border-pink-400 bg-pink-50'
                            : 'border-pink-100 hover:border-pink-300'
                        }`}
                      >
                        <span className="text-xl">{action.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{action.title}</p>
                          <p className="text-xs text-pink-500">+{action.points} 分</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-pink-700 mb-1">
                  給男友的留言 💌 <span className="text-pink-300 font-normal">（選填）</span>
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
                  placeholder="今天特別乖，獎你多一個親親 🥰"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedAction || loading}
                className="w-full py-3 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '送出中...' : selectedAction
                  ? `給予 +${Math.round(selectedAction.points * (todaySpecial?.bonus_multiplier ?? 1))} 積分 💕${todaySpecial ? ` (×${todaySpecial.bonus_multiplier})` : ''}`
                  : '給予積分 💕'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleDeduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-rose-600 mb-1">扣點數量</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold text-sm">
                    −
                  </span>
                  <input
                    type="number"
                    value={deductAmount}
                    onChange={(e) => setDeductAmount(e.target.value)}
                    min="1"
                    max="999"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-400"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-rose-600 mb-1">
                  扣點原因 <span className="text-rose-300 font-normal">（必填）</span>
                </label>
                <input
                  type="text"
                  value={deductReason}
                  onChange={(e) => setDeductReason(e.target.value)}
                  maxLength={100}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 text-sm focus:outline-none focus:border-rose-400"
                  placeholder="今天忘記回訊息 😤"
                />
              </div>

              <button
                type="submit"
                disabled={!deductAmount || !deductReason.trim() || loading}
                className="w-full py-3 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '處理中...' : `扣除 ${deductAmount || '?'} 積分 📉`}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
