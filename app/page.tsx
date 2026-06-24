import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import DailyTaskCard from '@/components/DailyTaskCard'
import type { PointTransaction, DailyTask, SpecialDate } from '@/lib/types'

const MILESTONES = [50, 100, 200, 500, 1000]

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error(`Auth error: ${authError.message}`)
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) throw new Error(`Profile error: ${profileError.message}`)
  if (!profile) redirect('/login')
  if (profile.role === 'admin') redirect('/admin')

  const { data: transactions } = await supabase
    .from('point_transactions')
    .select('*, point_actions(title, emoji)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: allTransactions } = await supabase
    .from('point_transactions')
    .select('points')
    .eq('user_id', user.id)

  const { data: redemptions } = await supabase
    .from('redemptions')
    .select('points_spent')
    .eq('user_id', user.id)

  const awarded = (allTransactions ?? []).reduce((sum, t) => sum + (t.points > 0 ? t.points : 0), 0)
  const deductions = (allTransactions ?? []).reduce((sum, t) => sum + (t.points < 0 ? t.points : 0), 0)
  const spent = (redemptions ?? []).reduce((sum, r) => sum + r.points_spent, 0)
  const balance = awarded + deductions - spent

  // Milestone logic
  const nextMilestone = MILESTONES.find((m) => m > awarded) ?? null
  const prevMilestone = [...MILESTONES].reverse().find((m) => m <= awarded) ?? 0
  const milestoneProgress = nextMilestone
    ? Math.round(((awarded - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
    : 100

  // Today's daily task + special dates (parallel)
  const today = new Date().toISOString().split('T')[0]
  const [{ data: todayTaskRows }, { data: specialDates }] = await Promise.all([
    supabase.from('daily_tasks').select('*').eq('task_date', today).limit(1),
    supabase.from('special_dates').select('*'),
  ])
  const todayTask = (todayTaskRows?.[0] ?? null) as DailyTask | null

  // Check if user already submitted today's task
  let taskAlreadyRequested = false
  if (todayTask) {
    const { data: existingReq } = await supabase
      .from('point_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('title', `完成每日任務：${todayTask.title}`)
      .gte('created_at', `${today}T00:00:00`)
      .limit(1)
    taskAlreadyRequested = (existingReq ?? []).length > 0
  }

  // Check if today is a special date
  const todaySpecial = ((specialDates ?? []) as SpecialDate[]).find((d) => {
    const dObj = new Date(d.date + 'T00:00:00')
    const mm = String(new Date().getMonth() + 1).padStart(2, '0')
    const dd = String(new Date().getDate()).padStart(2, '0')
    const dMM = String(dObj.getMonth() + 1).padStart(2, '0')
    const dDD = String(dObj.getDate()).padStart(2, '0')
    return d.repeat_yearly ? (dMM === mm && dDD === dd) : d.date === today
  }) ?? null

  // Streak calculation
  const { data: allDates } = await supabase
    .from('point_transactions')
    .select('created_at')
    .eq('user_id', user.id)
    .gt('points', 0)
    .order('created_at', { ascending: false })

  let streak = 0
  if (allDates && allDates.length > 0) {
    const uniqueDays = [...new Set(allDates.map((t) =>
      new Date(t.created_at).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })
    ))]
    const check = new Date()
    for (const day of uniqueDays) {
      if (new Date(check).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }) === day) {
        streak++
        check.setDate(check.getDate() - 1)
      } else break
    }
  }

  // Latest love note from admin
  const { data: latestNoteRows } = await supabase
    .from('point_transactions')
    .select('note, created_at')
    .eq('user_id', user.id)
    .not('note', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
  const latestNote = latestNoteRows?.[0] ?? null

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar role={profile.role} displayName={profile.display_name} />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-24 space-y-4">
        {/* Balance Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500 rounded-3xl p-6 text-white text-center mt-2 shadow-lg shadow-pink-300/40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.18)_0%,transparent_100%)] pointer-events-none" />
          <div className="relative">
            <p className="text-pink-100 text-xs font-medium tracking-widest uppercase mb-2">目前積分</p>
            <div className="text-7xl font-bold leading-none my-2 tabular-nums">{balance}</div>
            <p className="text-pink-200 text-sm">⭐ 分</p>
            <div className="flex justify-center gap-6 mt-5 text-xs text-pink-100">
              <div>
                <div className="text-white font-semibold tabular-nums">{awarded}</div>
                <div>累積獲得</div>
              </div>
              <div className="border-l border-pink-300/60" />
              <div>
                <div className="text-white font-semibold tabular-nums">{spent}</div>
                <div>已兌換</div>
              </div>
              {deductions < 0 && (
                <>
                  <div className="border-l border-pink-300/60" />
                  <div>
                    <div className="text-white font-semibold tabular-nums">{Math.abs(deductions)}</div>
                    <div>已扣除</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="text-2xl">{'🔥'.repeat(Math.min(streak, 5))}</div>
            <div>
              <p className="font-semibold text-amber-700 text-sm">連續 {streak} 天好表現！</p>
              <p className="text-xs text-amber-500">繼續保持，你最棒了 💪</p>
            </div>
          </div>
        )}

        {/* Special date banner */}
        {todaySpecial && (
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-3xl">{todaySpecial.emoji}</span>
            <div>
              <p className="font-bold text-rose-600 text-sm">今天是 {todaySpecial.name}！</p>
              <p className="text-xs text-rose-400 mt-0.5">
                所有積分 ×{todaySpecial.bonus_multiplier} 加倍中 🎉
              </p>
            </div>
          </div>
        )}

        {/* Today's daily task */}
        {todayTask && <DailyTaskCard task={todayTask} userId={user.id} alreadyRequested={taskAlreadyRequested} />}

        {/* Love note from admin */}
        {latestNote && (
          <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4 flex gap-3 items-start">
            <span className="text-2xl mt-0.5">💌</span>
            <div className="min-w-0">
              <p className="text-xs text-pink-400 font-medium mb-1">女友的留言</p>
              <p className="text-sm text-pink-700 leading-relaxed">{latestNote.note}</p>
              <p className="text-xs text-pink-300 mt-1">
                {new Date(latestNote.created_at).toLocaleDateString('zh-TW', {
                  timeZone: 'Asia/Taipei', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}

        {/* Milestone progress */}
        <div className="bg-white rounded-2xl p-4 shadow-sm shadow-pink-100/80">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-pink-700 flex items-center gap-1">
              <span>🏆</span> 積分里程碑
            </h2>
            <span className="text-xs text-pink-400">累積獲得 {awarded} 分</span>
          </div>

          {nextMilestone ? (
            <>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>{prevMilestone} 分</span>
                <span className="text-pink-500 font-medium">距離 {nextMilestone} 分還差 {nextMilestone - awarded} 分</span>
              </div>
              <div className="w-full bg-pink-100 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-pink-400 to-rose-400 h-2.5 rounded-full transition-all"
                  style={{ width: `${milestoneProgress}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-pink-500 font-medium">🎉 已達成全部里程碑！你真棒！</p>
          )}

          <div className="flex gap-2 mt-3 flex-wrap">
            {MILESTONES.map((m) => (
              <div
                key={m}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  awarded >= m
                    ? 'bg-pink-500 text-white'
                    : 'bg-pink-50 text-pink-300 border border-pink-100'
                }`}
              >
                {awarded >= m ? '✅' : '⬜'} {m}
              </div>
            ))}
          </div>
        </div>

        {/* Quick links - 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/rewards"
            className="bg-white rounded-2xl p-4 shadow-sm shadow-pink-100 flex flex-col items-center gap-2 hover:shadow-md hover:shadow-pink-200/60 transition-all active:scale-95"
          >
            <span className="text-3xl">🎁</span>
            <span className="text-sm font-medium text-pink-700">兌換獎勵</span>
          </a>
          <a
            href="/history"
            className="bg-white rounded-2xl p-4 shadow-sm shadow-pink-100 flex flex-col items-center gap-2 hover:shadow-md hover:shadow-pink-200/60 transition-all active:scale-95"
          >
            <span className="text-3xl">📋</span>
            <span className="text-sm font-medium text-pink-700">積分紀錄</span>
          </a>
          <a
            href="/requests"
            className="bg-white rounded-2xl p-4 shadow-sm shadow-pink-100 flex flex-col items-center gap-2 hover:shadow-md hover:shadow-pink-200/60 transition-all active:scale-95"
          >
            <span className="text-3xl">🙋</span>
            <span className="text-sm font-medium text-pink-700">申請給點</span>
          </a>
          <a
            href="/wishes"
            className="bg-white rounded-2xl p-4 shadow-sm shadow-pink-100 flex flex-col items-center gap-2 hover:shadow-md hover:shadow-pink-200/60 transition-all active:scale-95"
          >
            <span className="text-3xl">✨</span>
            <span className="text-sm font-medium text-pink-700">許願獎勵</span>
          </a>
        </div>

        {/* Recent transactions */}
        <div>
          <h2 className="font-semibold text-pink-700 mb-3 flex items-center gap-1.5">
            <span>🕐</span> 最近獲得紀錄
          </h2>

          {(!transactions || transactions.length === 0) ? (
            <div className="bg-white rounded-2xl p-8 text-center text-pink-300 shadow-sm shadow-pink-100/80">
              <div className="text-4xl mb-2">🌸</div>
              <p className="text-sm">還沒有積分紀錄，繼續加油！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(transactions as unknown as PointTransaction[]).map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm shadow-pink-100/80"
                >
                  <div className="text-2xl">
                    {tx.points < 0 ? '📉' : (tx.point_actions?.emoji ?? '⭐')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-700 truncate">
                      {tx.points < 0 ? '扣點' : (tx.point_actions?.title ?? '手動給分')}
                    </p>
                    {tx.note && (
                      <p className="text-xs text-gray-400 truncate">{tx.note}</p>
                    )}
                    <p className="text-xs text-pink-300 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('zh-TW', {
                        timeZone: 'Asia/Taipei', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className={`font-bold text-lg ${tx.points >= 0 ? 'text-pink-500' : 'text-rose-400'}`}>
                    {tx.points >= 0 ? `+${tx.points}` : tx.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
