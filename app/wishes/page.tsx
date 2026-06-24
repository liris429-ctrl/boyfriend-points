import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import WishesClient from '@/components/WishesClient'
import type { RewardWish } from '@/lib/types'

export default async function WishesPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error(`Auth error: ${authError.message}`)
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profileError) throw new Error(`Profile error: ${profileError.message}`)
  if (!profile) redirect('/login')
  if (profile.role === 'admin') redirect('/admin')

  const { data: wishes } = await supabase
    .from('reward_wishes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar role={profile.role} displayName={profile.display_name} />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-24 space-y-5">
        <div className="mt-2">
          <h1 className="text-xl font-bold text-pink-700 flex items-center gap-2">
            <span>✨</span> 許願獎勵
          </h1>
          <p className="text-sm text-pink-400 mt-0.5">告訴女友你想要什麼獎勵</p>
        </div>

        <WishesClient
          wishes={(wishes ?? []) as RewardWish[]}
          userId={user.id}
        />
      </main>
    </div>
  )
}
