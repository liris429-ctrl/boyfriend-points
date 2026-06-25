'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Reward } from '@/lib/types'

const EMOJI_OPTIONS = [
  '🎁', '🍜', '🎬', '🤗', '💆', '🏖️', '💋', '🍰', '🌹', '💐', '🎡', '🛍️', '☕', '🍦', '🎮', '🧸', '💍', '🌙',
  '🍕', '🍣', '🍱', '🥩', '🍔', '🧁', '🎂', '🍩', '🍫', '🧋', '🍷', '🥂', '🌮', '🫕', '🫙', '🧇',
  '🎪', '🎠', '🎢', '🎭', '🎤', '🎵', '🎸', '🎹', '🎨', '📸', '🎯', '🎳', '🏄', '🧗', '🚵', '⛷️',
  '✈️', '🚢', '🏕️', '🗺️', '🗼', '🏝️', '🎆', '🌅', '🌃', '🌌', '🛁', '💅', '💈', '🧖', '🕯️', '🌺',
  '🐶', '🐱', '🐰', '🦊', '🐻', '🦁', '🐼', '🦄', '🐠', '🌸', '🪷', '🌻', '🍓', '🍒', '🍑', '🥝',
]

interface Props {
  initialRewards: Reward[]
}

interface FormState {
  title: string
  emoji: string
  description: string
  pointsStr: string
  expires_at: string
}

function RewardForm({
  form,
  setForm,
  loading,
  isEdit,
  onSave,
  onCancel,
}: {
  form: FormState
  setForm: (f: FormState) => void
  loading: boolean
  isEdit: boolean
  onSave: () => void
  onCancel: () => void
}) {
  const pointsNum = parseInt(form.pointsStr)
  const pointsValid = !isNaN(pointsNum) && pointsNum >= 1

  return (
    <div className="bg-white rounded-2xl border border-pink-200 p-4 space-y-3">
      <h3 className="font-semibold text-pink-700">{isEdit ? '編輯獎勵' : '新增獎勵'}</h3>

      <div>
        <label className="text-xs text-pink-600 mb-1 block">Emoji</label>
        <div className="h-28 overflow-y-auto rounded-xl bg-pink-50/50 p-1.5">
          <div className="flex flex-wrap gap-1">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setForm({ ...form, emoji: e })}
                className={`text-xl p-1.5 rounded-lg border-2 transition ${
                  form.emoji === e ? 'border-pink-400 bg-white shadow-sm' : 'border-transparent hover:border-pink-200'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
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
          value={form.pointsStr}
          onChange={(e) => setForm({ ...form, pointsStr: e.target.value })}
          onBlur={() => {
            const n = parseInt(form.pointsStr)
            if (isNaN(n) || n < 1) setForm({ ...form, pointsStr: '1' })
          }}
          className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
        />
      </div>

      <div>
        <label className="text-xs text-pink-600 mb-1 block">說明（選填）</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          maxLength={80}
          className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
          placeholder="例：一起去吃燒肉，隨便點"
        />
      </div>

      <div>
        <label className="text-xs text-pink-600 mb-1 block">限時到期（選填）</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={form.expires_at.slice(0, 10)}
            onChange={(e) => {
              const date = e.target.value
              const time = form.expires_at.slice(11) || '23:59'
              setForm({ ...form, expires_at: date ? `${date}T${time}` : '' })
            }}
            className="flex-1 min-w-0 px-2 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
          />
          <input
            type="time"
            value={form.expires_at.slice(11) || ''}
            disabled={!form.expires_at.slice(0, 10)}
            onChange={(e) => {
              const date = form.expires_at.slice(0, 10)
              setForm({ ...form, expires_at: date ? `${date}T${e.target.value}` : '' })
            }}
            className="flex-1 min-w-0 px-2 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400 disabled:opacity-40"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={loading || !form.title.trim() || !pointsValid}
          className="flex-1 py-2 rounded-xl bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition disabled:opacity-50"
        >
          {loading ? '儲存中...' : '儲存'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-pink-200 text-pink-600 text-sm hover:bg-pink-50 transition"
        >
          取消
        </button>
      </div>
    </div>
  )
}

export default function ManageRewardsClient({ initialRewards }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const sorted = [...initialRewards].sort((a, b) => b.points_required - a.points_required)
  const [rewards, setRewards] = useState(sorted)
  const [addingNew, setAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ title: '', emoji: '🎁', description: '', pointsStr: '50', expires_at: '' })
  const [loading, setLoading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function startAdd() {
    setForm({ title: '', emoji: '🎁', description: '', pointsStr: '50', expires_at: '' })
    setEditingId(null)
    setAddingNew(true)
  }

  function startEdit(reward: Reward) {
    setForm({
      title: reward.title,
      emoji: reward.emoji,
      description: reward.description ?? '',
      pointsStr: String(reward.points_required),
      expires_at: reward.expires_at ? reward.expires_at.slice(0, 16) : '',
    })
    setAddingNew(false)
    setEditingId(reward.id)
  }

  function cancelForm() {
    setAddingNew(false)
    setEditingId(null)
  }

  async function handleSave() {
    const pts = parseInt(form.pointsStr)
    if (!form.title.trim() || isNaN(pts) || pts < 1) return
    setLoading(true)

    const payload = {
      title: form.title,
      emoji: form.emoji,
      description: form.description.trim() || null,
      points_required: pts,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    }

    if (editingId) {
      const { data } = await supabase.from('rewards').update(payload).eq('id', editingId).select().single()
      if (data) {
        setRewards(
          [...rewards.map((r) => (r.id === editingId ? data : r))].sort(
            (a, b) => b.points_required - a.points_required
          )
        )
      }
    } else {
      const { data } = await supabase.from('rewards').insert(payload).select().single()
      if (data) {
        setRewards([...rewards, data].sort((a, b) => b.points_required - a.points_required))
      }
    }

    setLoading(false)
    setAddingNew(false)
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    await supabase.from('rewards').delete().eq('id', id)
    setRewards(rewards.filter((r) => r.id !== id))
    setConfirmDeleteId(null)
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
      {addingNew && (
        <RewardForm
          form={form}
          setForm={setForm}
          loading={loading}
          isEdit={false}
          onSave={handleSave}
          onCancel={cancelForm}
        />
      )}

      <button
        onClick={startAdd}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-pink-300 text-pink-500 text-sm font-medium hover:bg-pink-50 transition"
      >
        ＋ 新增獎勵項目
      </button>

      <div className="space-y-2">
        {rewards.map((reward) => (
          <div key={reward.id}>
            <div
              className={`bg-white rounded-2xl border p-4 flex items-center gap-3 transition ${
                reward.active ? 'border-pink-100' : 'border-gray-100 opacity-50'
              }`}
            >
              <span className="text-2xl">{reward.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-700">{reward.title}</p>
                {reward.description && (
                  <p className="text-xs text-gray-400 truncate">{reward.description}</p>
                )}
                <p className="text-xs text-pink-500">{reward.points_required} 分</p>
                {reward.expires_at && (
                  <p className="text-xs text-orange-400">
                    ⏰ {new Date(reward.expires_at) < new Date() ? '已到期' : `到期：${new Date(reward.expires_at).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', month: 'short', day: 'numeric' })}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {confirmDeleteId === reward.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(reward.id)}
                      className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white font-medium transition"
                    >
                      確定
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-400 transition"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
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
                    <button
                      onClick={() => setConfirmDeleteId(reward.id)}
                      className="text-xs px-2 py-1 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition"
                    >
                      刪除
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingId === reward.id && (
              <div className="mt-2">
                <RewardForm
                  form={form}
                  setForm={setForm}
                  loading={loading}
                  isEdit={true}
                  onSave={handleSave}
                  onCancel={cancelForm}
                />
              </div>
            )}
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
