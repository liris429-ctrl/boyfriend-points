import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import DiaryClient from '@/components/DiaryClient'
import type { DiaryEntry, DiaryComment } from '@/lib/types'

export default async function DiaryPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error(`Auth error: ${authError.message}`)
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profileError) throw new Error(`Profile error: ${profileError.message}`)
  if (!profile) redirect('/login')

  // Fetch pending counts for admin badge
  let pendingCount = 0
  if (profile.role === 'admin') {
    const [{ count: a }, { count: b }, { count: c }] = await Promise.all([
      supabase.from('point_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reward_wishes').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('redemptions').select('*', { count: 'exact', head: true }).eq('fulfilled', false),
    ])
    pendingCount = (a ?? 0) + (b ?? 0) + (c ?? 0)
  }

  // Fetch entries and their authors — keep this simple so the profiles join is reliable
  const { data: entries } = await supabase
    .from('diary_entries')
    .select('*, profiles(display_name, role)')
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch comments separately — safe if diary_comments table not yet created
  const entryList = entries ?? []
  const { data: allComments } = entryList.length > 0
    ? await supabase
        .from('diary_comments')
        .select('*, profiles(display_name, role)')
        .in('entry_id', entryList.map(e => e.id))
        .order('created_at', { ascending: true })
    : { data: [] }

  // Group comments by entry
  const commentMap: Record<string, DiaryComment[]> = {}
  for (const c of (allComments ?? [])) {
    const comment = c as DiaryComment
    if (!commentMap[comment.entry_id]) commentMap[comment.entry_id] = []
    commentMap[comment.entry_id].push(comment)
  }

  const entriesWithComments: DiaryEntry[] = entryList.map(e => ({
    ...(e as DiaryEntry),
    diary_comments: commentMap[e.id] ?? [],
  }))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={profile.role} displayName={profile.display_name} pendingCount={pendingCount} />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-24 space-y-5">
        <div className="mt-2">
          <h1 className="text-xl font-bold text-pink-700 flex items-center gap-2">
            <span>📔</span> 情侶日記
          </h1>
          <p className="text-sm text-pink-400 mt-0.5">記錄你們的甜蜜故事</p>
        </div>

        <DiaryClient
          entries={entriesWithComments}
          userId={user.id}
          userRole={profile.role}
        />
      </main>
    </div>
  )
}
