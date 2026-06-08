import { createClient } from '@/lib/supabase/server'

export default async function MarqueeBar() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: customMsgs }, { data: recentTx }, { data: recentRd }] = await Promise.all([
    supabase
      .from('marquee_messages')
      .select('content')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('point_transactions')
      .select('points, note, point_actions(title, emoji)')
      .gt('points', 0)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('redemptions')
      .select('reward_title, reward_emoji')
      .order('created_at', { ascending: false })
      .limit(2),
  ])

  const autoItems: string[] = []
  for (const tx of recentTx ?? []) {
    const action = (tx.point_actions as unknown) as { title: string; emoji: string } | null
    autoItems.push(`${action?.emoji ?? '⭐'} +${tx.points} 分！${action?.title ?? ''}`)
  }
  for (const rd of recentRd ?? []) {
    autoItems.push(`${rd.reward_emoji} 兌換了${rd.reward_title}！`)
  }

  const allItems = [
    ...(customMsgs ?? []).map((m) => m.content),
    ...autoItems,
  ]

  if (allItems.length === 0) return null

  const doubled = [...allItems, ...allItems]

  return (
    <div className="bg-pink-500 text-white text-xs py-1.5 overflow-hidden">
      <div className="marquee-track gap-8 px-4">
        {doubled.map((item, i) => (
          <span key={i} className="shrink-0 px-4">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
