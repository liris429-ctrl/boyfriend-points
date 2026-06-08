import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import RewardsClient from '@/components/RewardsClient'
import type { Reward } from '@/lib/types'

export default async function RewardsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: rewards } = await supabase
    .from('rewards')
    .select('*')
    .eq('active', true)
    .order('points_required', { ascending: true })

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

      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-24 space-y-5">
        <div className="mt-2">
          <h1 className="text-xl font-bold text-pink-700 flex items-center gap-2">
            <span>🎁</span> 獎勵商城
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-pink-400">目前積分：</span>
            <span className="font-bold text-pink-600 text-lg">{balance} ⭐</span>
          </div>
        </div>

        <RewardsClient
          rewards={(rewards ?? []) as Reward[]}
          balance={balance}
          userId={user.id}
          displayName={profile.display_name}
        />
      </main>
    </div>
  )
}
