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
    { count: pendingRequestCount },
    { count: pendingWishCount },
    { count: pendingFulfillCount },
  ] = await Promise.all([
    supabase.from('point_actions').select('*').eq('active', true).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('role', 'user'),
    supabase.from('point_transactions')
      .select('*, point_actions(title, emoji), profiles!point_transactions_user_id_fkey(display_name)')
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('daily_tasks').select('*').eq('task_date', today).limit(1),
    supabase.from('special_dates').select('*'),
    supabase.from('point_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reward_wishes').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('redemptions').select('*', { count: 'exact', head: true }).eq('fulfilled', false),
  ])

  const pendingCount = (pendingRequestCount ?? 0) + (pendingWishCount ?? 0) + (pendingFulfillCount ?? 0)
  const todayTask = (todayTaskRows?.[0] ?? null) as DailyTask | null

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={profile.role} displayName={profile.display_name} pendingCount={pendingCount} />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-5">
        <div className="mt-2">
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
            <div className="space-y-2">
              {(recentTx as unknown as PointTransaction[]).map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl border border-pink-100 p-3 flex items-center gap-3"
                >
                  <div className="text-xl">{tx.points < 0 ? '📉' : (tx.point_actions?.emoji ?? '⭐')}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-700 truncate">
                      {tx.points < 0 ? '扣點' : (tx.point_actions?.title ?? '手動給分')}
                    </p>
                    {tx.note && <p className="text-xs text-gray-400 truncate">{tx.note}</p>}
                    <p className="text-xs text-pink-300">
                      {tx.profiles?.display_name} ·{' '}
                      {new Date(tx.created_at).toLocaleDateString('zh-TW', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
