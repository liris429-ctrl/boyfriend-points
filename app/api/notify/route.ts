import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetUserId, targetRole, title, body, url } = await req.json()

  let userIds: string[] = []
  if (targetUserId) {
    userIds = [targetUserId]
  } else if (targetRole) {
    const { data } = await supabase.from('profiles').select('id').eq('role', targetRole)
    userIds = (data ?? []).map((u: { id: string }) => u.id)
  }
  if (!userIds.length) return NextResponse.json({ ok: true })

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription, endpoint')
    .in('user_id', userIds)

  await Promise.allSettled(
    (subs ?? []).map((row: { subscription: webpush.PushSubscription; endpoint: string }) =>
      webpush
        .sendNotification(row.subscription, JSON.stringify({ title, body, url: url ?? '/' }))
        .catch(() => {
          supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint)
        })
    )
  )

  return NextResponse.json({ ok: true })
}
