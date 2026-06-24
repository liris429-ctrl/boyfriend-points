import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import AdminReviewClient from '@/components/AdminReviewClient'
import type { PointRequest, RewardWish, Redemption } from '@/lib/types'

export default async function AdminReviewPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error(`Auth error: ${authError.message}`)
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profileError) throw new Error(`Profile error: ${profileError.message}`)
  if (!profile || profile.role !== 'admin') redirect('/')

  const { data: requests } = await supabase
    .from('point_requests')
    .select('*, profiles!point_requests_user_id_fkey(display_name)')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })

  const { data: wishes } = await supabase
    .from('reward_wishes')
    .select('*, profiles!reward_wishes_user_id_fkey(display_name)')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })

  const { data: redemptions } = await supabase
    .from('redemptions')
    .select('*, profiles!redemptions_user_id_fkey(display_name)')
    .order('fulfilled', { ascending: true })
    .order('created_at', { ascending: false })

  const pendingCount =
    (requests ?? []).filter((r) => r.status === 'pending').length +
    (wishes ?? []).filter((w) => w.status === 'pending').length +
    (redemptions ?? []).filter((r) => !r.fulfilled).length

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar role={profile.role} displayName={profile.display_name} pendingCount={pendingCount} />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-5">
        <div className="mt-2">
          <h1 className="text-xl font-bold text-pink-700 flex items-center gap-2">
            <span>📋</span> 審核中心
          </h1>
          <p className="text-sm text-pink-400 mt-0.5">
            {pendingCount > 0 ? `有 ${pendingCount} 項待審核` : '目前沒有待審核項目'}
          </p>
        </div>

        <AdminReviewClient
          requests={(requests ?? []) as PointRequest[]}
          wishes={(wishes ?? []) as RewardWish[]}
          redemptions={(redemptions ?? []) as Redemption[]}
          adminId={user.id}
        />
      </main>
    </div>
  )
}
