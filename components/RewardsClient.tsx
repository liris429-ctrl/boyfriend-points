'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Reward } from '@/lib/types'

interface Props {
  rewards: Reward[]
  balance: number
  userId: string
  displayName: string
}

interface RedemptionResult {
  reward: Reward
  newBalance: number
  date: string
}

export default function RewardsClient({ rewards, balance, userId, displayName }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [currentBalance, setCurrentBalance] = useState(balance)
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<RedemptionResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null)

  async function handleRedeem(reward: Reward) {
    if (currentBalance < reward.points_required) return
    setConfirmReward(reward)
  }

  async function confirmRedeem() {
    if (!confirmReward) return
    setLoading(confirmReward.id)
    setConfirmReward(null)

    const now = new Date()
    const dateStr = now.toLocaleDateString('zh-TW', {
      timeZone: 'Asia/Taipei', year: 'numeric', month: 'long', day: 'numeric',
    })

    const { error } = await supabase.from('redemptions').insert({
      user_id: userId,
      reward_id: confirmReward.id,
      reward_title: confirmReward.title,
      reward_emoji: confirmReward.emoji,
      points_spent: confirmReward.points_required,
    })

    setLoading(null)

    if (!error) {
      const newBalance = currentBalance - confirmReward.points_required
      setCurrentBalance(newBalance)
      setResult({ reward: confirmReward, newBalance, date: dateStr })
      router.refresh()
    }
  }

  function buildLineText(r: Reward, newBal: number, date: string) {
    return `💖 我兌換了【${r.title}】！\n剩餘積分：${newBal} 分\n兌換時間：${date}\n記得要兌現喔 😊`
  }

  async function copyText() {
    if (!result) return
    const text = buildLineText(result.reward, result.newBalance, result.date)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (rewards.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center text-pink-300">
        <div className="text-4xl mb-2">🎁</div>
        <p className="text-sm">還沒有獎勵項目，請請女友新增</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Confirm dialog */}
      {confirmReward && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-xl">
            <div className="text-5xl mb-3">{confirmReward.emoji}</div>
            <h3 className="font-bold text-gray-700 text-lg">{confirmReward.title}</h3>
            <p className="text-pink-500 mt-1">需要 {confirmReward.points_required} 分</p>
            <p className="text-sm text-gray-400 mt-3">確定要兌換這個獎勵嗎？</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={confirmRedeem}
                className="flex-1 py-2.5 rounded-xl bg-pink-500 text-white font-semibold text-sm hover:bg-pink-600 transition"
              >
                確定兌換 🎉
              </button>
              <button
                onClick={() => setConfirmReward(null)}
                className="flex-1 py-2.5 rounded-xl border border-pink-200 text-pink-600 text-sm hover:bg-pink-50 transition"
              >
                再想想
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {result && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-xl">
            <div className="text-5xl mb-2">🎉</div>
            <h3 className="font-bold text-gray-700 text-lg">兌換成功！</h3>
            <p className="text-pink-500 mt-1">
              {result.reward.emoji} {result.reward.title}
            </p>
            <p className="text-sm text-gray-400 mt-1">剩餘 {result.newBalance} 分</p>

            <div className="mt-4 bg-pink-50 rounded-2xl p-3 text-left">
              <p className="text-xs text-pink-500 font-medium mb-2">📋 複製以下文字傳給女友：</p>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-5">
                {buildLineText(result.reward, result.newBalance, result.date)}
              </pre>
            </div>

            <button
              onClick={copyText}
              className={`w-full mt-3 py-2.5 rounded-xl font-semibold text-sm transition ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-pink-500 text-white hover:bg-pink-600'
              }`}
            >
              {copied ? '✅ 已複製！' : '複製文字'}
            </button>

            <button
              onClick={() => setResult(null)}
              className="w-full mt-2 py-2 rounded-xl border border-pink-200 text-pink-500 text-sm hover:bg-pink-50 transition"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {rewards.map((reward) => {
        const canAfford = currentBalance >= reward.points_required
        const isLoading = loading === reward.id
        const pct = Math.min(100, Math.round((currentBalance / reward.points_required) * 100))

        return (
          <div
            key={reward.id}
            className={`rounded-2xl p-4 flex items-center gap-4 transition-all ${
              canAfford
                ? 'bg-white shadow-md shadow-pink-200/50'
                : 'bg-white/70 shadow-sm shadow-gray-100'
            }`}
          >
            <div className={`text-3xl ${!canAfford ? 'opacity-50' : ''}`}>{reward.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold ${canAfford ? 'text-gray-800' : 'text-gray-400'}`}>{reward.title}</p>
              {reward.description && (
                <p className={`text-xs mt-0.5 leading-relaxed ${canAfford ? 'text-gray-500' : 'text-gray-300'}`}>{reward.description}</p>
              )}
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-sm font-semibold tabular-nums ${canAfford ? 'text-pink-500' : 'text-gray-400'}`}>
                  {reward.points_required}
                </span>
                <span className={`text-xs ${canAfford ? 'text-pink-400' : 'text-gray-300'}`}>⭐ 分</span>
              </div>
              {!canAfford && (
                <div className="mt-2">
                  <div className="w-full bg-gray-100 rounded-full h-1">
                    <div
                      className="bg-pink-300 h-1 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-300 mt-1">還差 {reward.points_required - currentBalance} 分</p>
                </div>
              )}
            </div>

            <button
              onClick={() => handleRedeem(reward)}
              disabled={!canAfford || !!loading}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 shrink-0 ${
                canAfford && !loading
                  ? 'bg-pink-500 text-white hover:bg-pink-600 shadow-sm shadow-pink-300/50'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              {isLoading ? '…' : canAfford ? '兌換' : '不足'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
