'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SpecialDate } from '@/lib/types'

const EMOJI_OPTIONS = ['🎊', '🎂', '💕', '🌹', '🎁', '🥂', '🎉', '💍', '🌸', '❤️', '🏖️', '✈️']

interface Props {
  dates: SpecialDate[]
}

export default function SpecialDatesClient({ dates: initial }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [dates, setDates] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    emoji: '🎊',
    date: '',
    repeat_yearly: true,
    bonus_multiplier: 2,
  })

  async function handleSave() {
    if (!form.name.trim() || !form.date) return
    setLoading(true)

    const { data } = await supabase
      .from('special_dates')
      .insert({
        name: form.name.trim(),
        emoji: form.emoji,
        date: form.date,
        repeat_yearly: form.repeat_yearly,
        bonus_multiplier: form.bonus_multiplier,
      })
      .select()
      .single()

    setLoading(false)
    if (data) {
      setDates([...dates, data as SpecialDate])
      setShowForm(false)
      setForm({ name: '', emoji: '🎊', date: '', repeat_yearly: true, bonus_multiplier: 2 })
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    await supabase.from('special_dates').delete().eq('id', id)
    setDates(dates.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <div className="bg-white rounded-2xl border border-pink-200 p-4 space-y-3">
          <h3 className="font-semibold text-pink-700 text-sm">新增特殊日期</h3>

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

          <div>
            <label className="text-xs text-pink-500 mb-1 block">名稱</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={20}
              placeholder="交往紀念日"
              className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-pink-500 mb-1 block">日期</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
              />
            </div>
            <div>
              <label className="text-xs text-pink-500 mb-1 block">積分倍數</label>
              <select
                value={form.bonus_multiplier}
                onChange={(e) => setForm({ ...form, bonus_multiplier: parseFloat(e.target.value) })}
                className="w-full px-2 py-2 rounded-xl border border-pink-200 text-sm focus:outline-none focus:border-pink-400"
              >
                <option value={1.5}>×1.5</option>
                <option value={2}>×2</option>
                <option value={3}>×3</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.repeat_yearly}
              onChange={(e) => setForm({ ...form, repeat_yearly: e.target.checked })}
              className="rounded"
            />
            每年重複
          </label>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.date || loading}
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
        onClick={() => setShowForm(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-pink-300 text-pink-500 text-sm font-medium hover:bg-pink-50 transition"
      >
        ＋ 新增特殊日期
      </button>

      <div className="space-y-2">
        {dates.length === 0 && (
          <div className="text-center text-pink-300 py-6">
            <div className="text-4xl mb-2">🎊</div>
            <p className="text-sm">還沒有設定特殊日期</p>
          </div>
        )}
        {dates.map((d) => {
          const dateObj = new Date(d.date + 'T00:00:00')
          const formatted = dateObj.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })
          return (
            <div key={d.id} className="bg-white rounded-2xl border border-pink-100 p-4 flex items-center gap-3">
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-700">{d.name}</p>
                <p className="text-xs text-pink-400">
                  {formatted}{d.repeat_yearly ? '（每年）' : ''} · ×{d.bonus_multiplier} 倍積分
                </p>
              </div>
              <button
                onClick={() => handleDelete(d.id)}
                className="text-xs text-red-300 hover:text-red-500 transition px-2 py-1"
              >
                刪除
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
