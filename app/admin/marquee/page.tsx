import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import MarqueeAdminClient from '@/components/MarqueeAdminClient'
import type { MarqueeMessage } from '@/lib/types'

export default async function MarqueePage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error(`Auth error: ${authError.message}`)
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profileError) throw new Error(`Profile error: ${profileError.message}`)
  if (!profile || profile.role !== 'admin') redirect('/')

  const [
    { data: messages },
    { count: pendingRequestCount },
    { count: pendingWishCount },
    { count: pendingFulfillCount },
  ] = await Promise.all([
    supabase.from('marquee_messages').select('*').order('sort_order', { ascending: true }),
    supabase.from('point_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reward_wishes').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('redemptions').select('*', { count: 'exact', head: true }).eq('fulfilled', false),
  ])

  const pendingCount = (pendingRequestCount ?? 0) + (pendingWishCount ?? 0) + (pendingFulfillCount ?? 0)

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar role={profile.role} displayName={profile.display_name} pendingCount={pendingCount} />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-5">
        <div className="mt-2">
          <h1 className="text-xl font-bold text-pink-700 flex items-center gap-2">
            <span>📢</span> 跑馬燈設定
          </h1>
          <p className="text-sm text-pink-400 mt-0.5">設定顯示在頁面頂端的跑馬燈文字</p>
        </div>

        <MarqueeAdminClient messages={(messages ?? []) as MarqueeMessage[]} />
      </main>
    </div>
  )
}
