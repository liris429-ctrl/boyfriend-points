'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PointAction } from '@/lib/types'

const EMOJI_OPTIONS = [
  '⭐', '🧹', '🍳', '💬', '🎬', '🎁', '📱', '💆', '🌹', '🚗', '🛒', '❤️', '🐾', '🌸', '✨',
  '🏃', '📚', '🎵', '🫧', '🌙', '☕', '🍜', '🍱', '🎂', '🧸', '💪', '🚿', '🛏️', '🪴', '🐕',
  '🎮', '🎯', '🛵', '🏋️', '🤸', '🧘', '🚴', '🌅', '🌃', '🎤', '💌', '🤝', '🫶', '😊', '🥰',
  '🍰', '🍕', '🥗', '🛍️', '🎪', '📸', '🎨', '🎭', '🎹', '🎸', '🌿', '🪷', '🦋', '🍓', '🧁',
]

interface Props {
  initialActions: PointAction[]
}

export default function ManageActionsClient({ initialActions }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [actions, setActions] = useState(initialActions)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', emoji: '⭐', points: 10 })
  const [loading, setLoading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function startAdd() {
    setForm({ title: '', emoji: '⭐', points: 10 })
    setEditingId(null)
    setShowForm(true)
  }

  function startEdit(action: PointAction) {
    setForm({ title: action.title, emoji: action.emoji, points: action.points })
    setEditingId(action.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setLoading(true)

    if (editingId) {
      const { data } = await supabase
        .from('point_actions')
        .update({ title: form.title, emoji: form.emoji, points: form.points })
        .eq('id', editingId)
        .select()
        .single()
      if (data) setActions(actions.map((a) => (a.id === editingId ? data : a)))
    } else {
      const { data } = await supabase
        .from('point_actions')
        .insert({ title: form.title, emoji: form.emoji, points: form.points })
        .select()
        .single()
      if (data) setActions([data, ...actions])
    }

    setLoading(false)
    setShowForm(false)
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    await supabase.from('point_actions').delete().eq('id', id)
    setActions(actions.filter((a) => a.id !== id))
    setConfirmDeleteId(null)
    router.refresh()
  }

  async function toggleActive(action: PointAction) {
    const { data } = await supabase
      .from('point_actions')
      .update({ active: !action.active })
      .eq('id', action.id)
      .select()
      .single()
    if (data) setActions(actions.map((a) => (a.id === action.id ? data : a)))
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <div className="bg-white rounded-2xl border border-pink-200 p-4 space-y-3">
          <h3 className="font-semibold text-pink-700">{editingId ? '編輯項目' : '新增項目'}</h3>

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
            <label className="text-xs text-pink-600 mb-1 block">項目名稱</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
              placeholder="幫忙做家事"
            />
          </div>

          <div>
            <label className="text-xs text-pink-600 mb-1 block">積分</label>
            <input
              type="number"
              min={1}
              value={form.points}
              onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 1 })}
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
        ＋ 新增積分項目
      </button>

      <div className="space-y-2">
        {actions.map((action) => (
          <div
            key={action.id}
            className={`bg-white rounded-2xl border p-4 flex items-center gap-3 transition ${
              action.active ? 'border-pink-100' : 'border-gray-100 opacity-50'
            }`}
          >
            <span className="text-2xl">{action.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-700">{action.title}</p>
              <p className="text-xs text-pink-500">+{action.points} 分</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {confirmDeleteId === action.id ? (
                <>
                  <button
                    onClick={() => handleDelete(action.id)}
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
                    onClick={() => startEdit(action)}
                    className="text-xs px-2 py-1 rounded-lg border border-pink-200 text-pink-600 hover:bg-pink-50 transition"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => toggleActive(action)}
                    className={`text-xs px-2 py-1 rounded-lg border transition ${
                      action.active
                        ? 'border-gray-200 text-gray-400 hover:bg-gray-50'
                        : 'border-pink-200 text-pink-500 hover:bg-pink-50'
                    }`}
                  >
                    {action.active ? '停用' : '啟用'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(action.id)}
                    className="text-xs px-2 py-1 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition"
                  >
                    刪除
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {actions.length === 0 && (
          <div className="text-center text-pink-300 py-8">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-sm">還沒有積分項目</p>
          </div>
        )}
      </div>
    </div>
  )
}
