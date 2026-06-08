'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DailyTask } from '@/lib/types'

interface Props {
  task: DailyTask
  userId: string
}

export default function DailyTaskCard({ task, userId }: Props) {
  const supabase = createClient()
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleComplete() {
    setStatus('loading')
    setError(null)

    const { error: err } = await supabase.from('point_requests').insert({
      user_id: userId,
      title: `完成每日任務：${task.title}`,
      points_suggested: task.points,
      reason: '完成今天的每日任務',
    })

    if (err) {
      setError(err.message)
      setStatus('idle')
    } else {
      setStatus('done')
    }
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
          📋 今日任務
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-3xl">{task.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-700">{task.title}</p>
          <p className="text-xs text-amber-600">完成可獲得 +{task.points} 分</p>
        </div>

        {status === 'done' ? (
          <div className="text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
            ✅ 已申請
          </div>
        ) : (
          <button
            onClick={handleComplete}
            disabled={status === 'loading'}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-400 text-white hover:bg-amber-500 active:scale-95 transition disabled:opacity-50"
          >
            {status === 'loading' ? '...' : '已完成 🙋'}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-2">❌ {error}</p>}
    </div>
  )
}
