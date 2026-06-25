import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import AwardPointsForm from '@/components/AwardPointsForm'
import AdminDailyTaskForm from '@/components/AdminDailyTaskForm'
import type { PointAction, Profile, PointTransaction, DailyTask, SpecialDate } from '@/lib/types'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error(`Auth error: ${authError.message}`)
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profileError) throw new Error(`Profile error: ${profileError.message}`)
  if (!profile || profile.role !== 'admin') redirect('/')

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: actions },
    { data: users },
    { data: recentTx },
    { data: todayTaskRows },
    { data: specialDates },
    { data: allTx },
    { data: allRedemptions },
    { count: pendingRequestCount },
    { count: pendingWishCount },
    { count: pendingFulfillCount },
  ] = await Promise.all([
    supabase.from('point_actions').select('*').eq('active', true).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('role', 'user'),
    supabase.from('point_transactions')
      .select('*, point_actions(title, emoji), profiles!point_transactions_user_id_fkey(display_name)')
      .order('created_at', { ascending: false }).limit(20),
    supabase.from('daily_tasks').select('*').eq('task_date', today).limit(1),
    supabase.from('special_dates').select('*'),
    supabase.from('point_transactions').select('user_id, points'),
    supabase.from('redemptions').select('user_id, points_spent'),
    supabase.from('point_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reward_wishes').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('redemptions').select('*', { count: 'exact', head: true }).eq('fulfilled', false),
  ])

  const pendingCount = (pendingRequestCount ?? 0) + (pendingWishCount ?? 0) + (pendingFulfillCount ?? 0)
  const todayTask = (todayTaskRows?.[0] ?? null) as DailyTask | null

  // Calculate per-user balance for the overview card
  const userBalances = (users ?? []).map((u) => {
    const awarded = (allTx ?? []).filter((t) => t.user_id === u.id && t.points > 0).reduce((s, t) => s + t.points, 0)
    const deducted = (allTx ?? []).filter((t) => t.user_id === u.id && t.points < 0).reduce((s, t) => s + t.points, 0)
    const spent = (allRedemptions ?? []).filter((r) => r.user_id === u.id).reduce((s, r) => s + r.points_spent, 0)
    return { ...u, balance: awarded + deducted - spent, awarded }
  })

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar role={profile.role} displayName={profile.display_name} userId={user.id} pendingCount={pendingCount} />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-5">
        {/* Boyfriend balance overview */}
        {userBalances.length > 0 && (
          <div className="mt-2 flex gap-3">
            {userBalances.map((u) => (
              <div
                key={u.id}
                className="relative overflow-hidden flex-1 bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500 rounded-2xl p-4 text-white shadow-md shadow-pink-300/40"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.15)_0%,transparent_100%)] pointer-events-none" />
                <div className="relative">
                  <p className="text-pink-100 text-xs mb-1">💙 {u.display_name} 的積分</p>
                  <p className="text-4xl font-bold leading-none tabular-nums">{u.balance}</p>
                  <p className="text-pink-200 text-xs mt-1">累積獲得 {u.awarded} 分</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <h1 className="text-xl font-bold text-pink-700 flex items-center gap-2">
            <span>⭐</span> 給分
          </h1>
          <p className="text-sm text-pink-400 mt-0.5">選擇好事類型，幫男友記錄積分</p>
        </div>

        <AwardPointsForm
          actions={(actions ?? []) as PointAction[]}
          users={(users ?? []) as Profile[]}
          adminId={user.id}
          specialDates={(specialDates ?? []) as SpecialDate[]}
        />

        {/* Daily task */}
        <div>
          <h2 className="font-semibold text-amber-600 mb-2 flex items-center gap-1.5 text-sm">
            <span>📋</span> 今日任務
          </h2>
          <AdminDailyTaskForm todayTask={todayTask} adminId={user.id} />
        </div>

        {/* Recent activity */}
        <div>
          <h2 className="font-semibold text-pink-700 mb-3 flex items-center gap-1.5">
            <span>🕐</span> 最近給分紀錄
          </h2>

          {(!recentTx || recentTx.length === 0) ? (
            <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center text-pink-300">
              <div className="text-4xl mb-2">🌸</div>
              <p className="text-sm">還沒有給分紀錄</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(recentTx as unknown as PointTransaction[]).map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl border border-pink-100 p-3 flex items-center gap-3"
                >
                  <div className="text-xl">{tx.points < 0 ? '📉' : (tx.point_actions?.emoji ?? '⭐')}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-700 truncate">
                      {tx.points < 0 ? '扣點' : (tx.point_actions?.title ?? tx.note ?? '手動給分')}
                    </p>
                    {tx.note && tx.point_actions && <p className="text-xs text-gray-400 truncate">{tx.note}</p>}
                    <p className="text-xs text-pink-300">
                      {tx.profiles?.display_name} ·{' '}
                      {new Date(tx.created_at).toLocaleDateString('zh-TW', {
                        timeZone: 'Asia/Taipei', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className={`font-bold ${tx.points >= 0 ? 'text-pink-500' : 'text-rose-400'}`}>
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
