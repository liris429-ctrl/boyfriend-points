import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import ManageRewardsClient from '@/components/ManageRewardsClient'
import type { Reward } from '@/lib/types'

export default async function ManageRewardsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/')

  const { data: rewards } = await supabase
    .from('rewards')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar role={profile.role} displayName={profile.display_name} />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-5">
        <div className="mt-2">
          <h1 className="text-xl font-bold text-pink-700 flex items-center gap-2">
            <span>🎁</span> 獎勵項目管理
          </h1>
          <p className="text-sm text-pink-400 mt-0.5">管理男友可以兌換的甜蜜獎勵</p>
        </div>

        <ManageRewardsClient initialRewards={(rewards ?? []) as Reward[]} />
      </main>
    </div>
  )
}
