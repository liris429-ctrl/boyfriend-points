import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import RequestPointsClient from '@/components/RequestPointsClient'
import type { PointRequest } from '@/lib/types'

export default async function RequestsPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error(`Auth error: ${authError.message}`)
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profileError) throw new Error(`Profile error: ${profileError.message}`)
  if (!profile) redirect('/login')
  if (profile.role === 'admin') redirect('/admin')

  const { data: requests } = await supabase
    .from('point_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar role={profile.role} displayName={profile.display_name} userId={user.id} />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-24 space-y-5">
        <div className="mt-2">
          <h1 className="text-xl font-bold text-pink-700 flex items-center gap-2">
            <span>🙋</span> 申請給點
          </h1>
          <p className="text-sm text-pink-400 mt-0.5">做了好事記得申請，等女友審核確認</p>
        </div>

        <RequestPointsClient
          requests={(requests ?? []) as PointRequest[]}
          userId={user.id}
        />
      </main>
    </div>
  )
}
