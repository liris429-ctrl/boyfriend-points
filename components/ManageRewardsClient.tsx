'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Reward } from '@/lib/types'

const EMOJI_OPTIONS = ['🎁', '🍜', '🎬', '🤗', '💆', '🏖️', '💋', '🍰', '🌹', '💐', '🎡', '🛍️', '☕', '🍦', '🎮', '🧸', '💍', '🌙']

interface Props {
  initialRewards: Reward[]
}

export default function ManageRewardsClient({ initialRewards }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [rewards, setRewards] = useState(initialRewards)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', emoji: '🎁', points_required: 50 })
  const [loading, setLoading] = useState(false)

  function startAdd() {
    setForm({ title: '', emoji: '🎁', points_required: 50 })
    setEditingId(null)
    setShowForm(true)
  }

  function startEdit(reward: Reward) {
    setForm({ title: reward.title, emoji: reward.emoji, points_required: reward.points_required })
    setEditingId(reward.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setLoading(true)

    if (editingId) {
      const { data } = await supabase
        .from('rewards')
        .update({ title: form.title, emoji: form.emoji, points_required: form.points_required })
        .eq('id', editingId)
        .select()
        .single()
      if (data) setRewards(rewards.map((r) => (r.id === editingId ? data : r)))
    } else {
      const { data } = await supabase
        .from('rewards')
        .insert({ title: form.title, emoji: form.emoji, points_required: form.points_required })
        .select()
        .single()
      if (data) setRewards([data, ...rewards])
    }

    setLoading(false)
    setShowForm(false)
    setEditingId(null)
    router.refresh()
  }

  async function toggleActive(reward: Reward) {
    const { data } = await supabase
      .from('rewards')
      .update({ active: !reward.active })
      .eq('id', reward.id)
      .select()
      .single()
    if (data) setRewards(rewards.map((r) => (r.id === reward.id ? data : r)))
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <div className="bg-white rounded-2xl border border-pink-200 p-4 space-y-3">
          <h3 className="font-semibold text-pink-700">{editingId ? '編輯獎勵' : '新增獎勵'}</h3>

          <div>
            <label className="text-xs text-pink-600 mb-1 block">Emoji</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm({ ...form, emoji: e })}
                  className={`text-xl p-1.5 rounded-lg border-2 transition ${
                    form.emoji === e ? 'border-pink-400 bg-pink-50' : 'border-transparent hover:border-pink-200'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-pink-600 mb-1 block">獎勵名稱</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
              placeholder="一頓大餐"
            />
          </div>

          <div>
            <label className="text-xs text-pink-600 mb-1 block">所需積分</label>
            <input
              type="number"
              min={1}
              value={form.points_required}
              onChange={(e) => setForm({ ...form, points_required: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading || !form.title.trim()}
              className="flex-1 py-2 rounded-xl bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition disabled:opacity-50"
            >
              {loading ? '儲存中...' : '儲存'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-xl border border-pink-200 text-pink-600 text-sm hover:bg-pink-50 transition"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <button
        onClick={startAdd}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-pink-300 text-pink-500 text-sm font-medium hover:bg-pink-50 transition"
      >
        ＋ 新增獎勵項目
      </button>

      <div className="space-y-2">
        {rewards.map((reward) => (
          <div
            key={reward.id}
            className={`bg-white rounded-2xl border p-4 flex items-center gap-3 transition ${
              reward.active ? 'border-pink-100' : 'border-gray-100 opacity-50'
            }`}
          >
            <span className="text-2xl">{reward.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-700">{reward.title}</p>
              <p className="text-xs text-pink-500">{reward.points_required} 分</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(reward)}
                className="text-xs px-2 py-1 rounded-lg border border-pink-200 text-pink-600 hover:bg-pink-50 transition"
              >
                編輯
              </button>
              <button
                onClick={() => toggleActive(reward)}
                className={`text-xs px-2 py-1 rounded-lg border transition ${
                  reward.active
                    ? 'border-gray-200 text-gray-400 hover:bg-gray-50'
                    : 'border-pink-200 text-pink-500 hover:bg-pink-50'
                }`}
              >
                {reward.active ? '停用' : '啟用'}
              </button>
            </div>
          </div>
        ))}

        {rewards.length === 0 && (
          <div className="text-center text-pink-300 py-8">
            <div className="text-4xl mb-2">🎁</div>
            <p className="text-sm">還沒有獎勵項目</p>
          </div>
        )}
      </div>
    </div>
  )
}
