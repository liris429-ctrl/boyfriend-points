'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PointAction, Profile } from '@/lib/types'

interface Props {
  actions: PointAction[]
  users: Profile[]
  adminId: string
}

export default function AwardPointsForm({ actions, users, adminId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [selectedAction, setSelectedAction] = useState<PointAction | null>(null)
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAction || !selectedUserId) return

    setLoading(true)

    const { error } = await supabase.from('point_transactions').insert({
      user_id: selectedUserId,
      action_id: selectedAction.id,
      points: selectedAction.points,
      note: note.trim() || null,
      awarded_by: adminId,
    })

    setLoading(false)

    if (!error) {
      setSuccess(true)
      setNote('')
      setSelectedAction(null)
      setTimeout(() => {
        setSuccess(false)
        router.refresh()
      }, 2000)
    }
  }

  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-pink-100 p-6 text-center text-pink-300">
        <p className="text-sm">還沒有積分項目，請先到「積分項目」新增</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-pink-100 p-4 space-y-4">
      {users.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-pink-700 mb-2">給誰？</label>
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

      <div>
        <label className="block text-sm font-medium text-pink-700 mb-1">備註（選填）</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={100}
          className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
          placeholder="今天特別乖 🥰"
        />
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-green-600 text-sm font-medium">🎉 積分已成功給予！</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!selectedAction || loading || success}
        className="w-full py-3 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '送出中...' : success ? '✅ 給分成功！' : `給予 ${selectedAction ? `+${selectedAction.points} 分` : '積分'} 💕`}
      </button>
    </form>
  )
}
