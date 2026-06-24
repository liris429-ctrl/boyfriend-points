import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import SpecialDatesClient from '@/components/SpecialDatesClient'
import type { SpecialDate } from '@/lib/types'

export default async function SpecialDatesPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error(`Auth error: ${authError.message}`)
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profileError) throw new Error(`Profile error: ${profileError.message}`)
  if (!profile || profile.role !== 'admin') redirect('/')

  const { data: dates } = await supabase
    .from('special_dates')
    .select('*')
    .order('date', { ascending: true })

  const { count: pendingCount } = await supabase
    .from('point_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: pendingWishCount } = await supabase
    .from('reward_wishes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar
        role={profile.role}
        displayName={profile.display_name}
        pendingCount={(pendingCount ?? 0) + (pendingWishCount ?? 0)}
      />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-5">
        <div className="mt-2">
          <h1 className="text-xl font-bold text-pink-700 flex items-center gap-2">
            <span>🎊</span> 特殊日期管理
          </h1>
          <p className="text-sm text-pink-400 mt-0.5">設定紀念日、生日等特殊日期，當天給分自動加倍</p>
        </div>

        <SpecialDatesClient dates={(dates ?? []) as SpecialDate[]} />
      </main>
    </div>
  )
}
