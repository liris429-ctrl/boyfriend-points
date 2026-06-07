import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import type { PointTransaction } from '@/lib/types'

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

  const earned = (allTransactions ?? []).reduce((sum, t) => sum + t.points, 0)
  const spent = (redemptions ?? []).reduce((sum, r) => sum + r.points_spent, 0)
  const balance = earned - spent

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={profile.role} displayName={profile.display_name} />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-5">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-pink-400 to-rose-400 rounded-3xl p-6 text-white text-center shadow-md mt-2">
          <p className="text-pink-100 text-sm mb-1">目前積分</p>
          <div className="text-7xl font-bold my-2">{balance}</div>
          <p className="text-pink-100 text-sm">⭐ 分</p>
          <div className="flex justify-center gap-6 mt-4 text-xs text-pink-100">
            <div>
              <div className="text-white font-semibold">{earned}</div>
              <div>累積獲得</div>
            </div>
            <div className="border-l border-pink-300" />
            <div>
              <div className="text-white font-semibold">{spent}</div>
              <div>已兌換</div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/rewards"
            className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm flex flex-col items-center gap-2 hover:border-pink-300 transition active:scale-95"
          >
            <span className="text-3xl">🎁</span>
            <span className="text-sm font-medium text-pink-700">兌換獎勵</span>
          </a>
          <a
            href="/history"
            className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm flex flex-col items-center gap-2 hover:border-pink-300 transition active:scale-95"
          >
            <span className="text-3xl">📋</span>
            <span className="text-sm font-medium text-pink-700">積分紀錄</span>
          </a>
        </div>

        {/* Recent transactions */}
        <div>
          <h2 className="font-semibold text-pink-700 mb-3 flex items-center gap-1.5">
            <span>🕐</span> 最近獲得紀錄
          </h2>

          {(!transactions || transactions.length === 0) ? (
            <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center text-pink-300">
              <div className="text-4xl mb-2">🌸</div>
              <p className="text-sm">還沒有積分紀錄，繼續加油！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(transactions as unknown as PointTransaction[]).map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl border border-pink-100 p-4 flex items-center gap-3"
                >
                  <div className="text-2xl">
                    {tx.point_actions?.emoji ?? '⭐'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-700 truncate">
                      {tx.point_actions?.title ?? '手動給分'}
                    </p>
                    {tx.note && (
                      <p className="text-xs text-gray-400 truncate">{tx.note}</p>
                    )}
                    <p className="text-xs text-pink-300 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('zh-TW', {
                        month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-pink-500 font-bold text-lg">+{tx.points}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
