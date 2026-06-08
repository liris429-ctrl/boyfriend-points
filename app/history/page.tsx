import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import type { PointTransaction, Redemption } from '@/lib/types'

export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const isAdmin = profile.role === 'admin'

  const txBase = supabase
    .from('point_transactions')
    .select('*, point_actions(title, emoji), profiles!point_transactions_user_id_fkey(display_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: transactions } = await (isAdmin ? txBase : txBase.eq('user_id', user.id))

  const rdBase = supabase
    .from('redemptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: redemptions } = await (isAdmin ? rdBase : rdBase.eq('user_id', user.id))

  type Entry =
    | { type: 'earn'; data: PointTransaction; date: string }
    | { type: 'redeem'; data: Redemption; date: string }

  const entries: Entry[] = [
    ...((transactions ?? []) as unknown as PointTransaction[]).map((t) => ({
      type: 'earn' as const,
      data: t,
      date: t.created_at,
    })),
    ...((redemptions ?? []) as unknown as Redemption[]).map((r) => ({
      type: 'redeem' as const,
      data: r,
      date: r.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={profile.role} displayName={profile.display_name} />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-24 space-y-5">
        <div className="mt-2">
          <h1 className="text-xl font-bold text-pink-700 flex items-center gap-2">
            <span>📋</span> 積分紀錄
          </h1>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center text-pink-300">
            <div className="text-4xl mb-2">🌸</div>
            <p className="text-sm">還沒有任何紀錄</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              if (entry.type === 'earn') {
                const tx = entry.data as unknown as PointTransaction
                return (
                  <div
                    key={`tx-${tx.id}`}
                    className="bg-white rounded-2xl border border-pink-100 p-4 flex items-center gap-3"
                  >
                    <div className="text-2xl">{tx.points < 0 ? '📉' : (tx.point_actions?.emoji ?? '⭐')}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-700 truncate">
                        {tx.points < 0 ? '扣點' : (tx.point_actions?.title ?? '手動給分')}
                      </p>
                      {tx.note && <p className="text-xs text-gray-400 truncate">{tx.note}</p>}
                      {isAdmin && (
                        <p className="text-xs text-blue-400">{tx.profiles?.display_name}</p>
                      )}
                      <p className="text-xs text-pink-300">
                        {new Date(tx.created_at).toLocaleDateString('zh-TW', {
                          year: 'numeric', month: 'long', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className={`font-bold ${tx.points >= 0 ? 'text-green-500' : 'text-rose-400'}`}>
                      {tx.points >= 0 ? `+${tx.points}` : tx.points}
                    </div>
                  </div>
                )
              } else {
                const r = entry.data as unknown as Redemption
                return (
                  <div
                    key={`rd-${r.id}`}
                    className="bg-white rounded-2xl border border-rose-100 p-4 flex items-center gap-3"
                  >
                    <div className="text-2xl">{r.reward_emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-700 truncate">
                        兌換：{r.reward_title}
                      </p>
                      <p className="text-xs text-pink-300">
                        {new Date(r.created_at).toLocaleDateString('zh-TW', {
                          year: 'numeric', month: 'long', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-rose-400 font-bold">-{r.points_spent}</div>
                  </div>
                )
              }
            })}
          </div>
        )}
      </main>
    </div>
  )
}
