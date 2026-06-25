'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { urlBase64ToUint8Array } from '@/lib/push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

export default function PushSubscriber({ userId }: { userId: string }) {
  const supabase = createClient()
  const [status, setStatus] = useState<'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'>('loading')
  const [busy, setBusy] = useState(false)
  const [isIosSafari, setIsIosSafari] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const ios = /iP(hone|ad|od)/.test(ua)
    const safari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsIosSafari(ios && safari && !standalone)

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const perm = Notification.permission
      if (perm === 'denied') { setStatus('denied'); return }
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'subscribed' : 'unsubscribed')
    })
  }, [])

  async function subscribe() {
    if (isIosSafari) { setShowIosHint(true); return }
    setBusy(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const subJson = sub.toJSON() as { endpoint: string; keys: Record<string, string> }
      await supabase.from('push_subscriptions').upsert(
        { user_id: userId, endpoint: subJson.endpoint, subscription: subJson },
        { onConflict: 'endpoint' }
      )
      setStatus('subscribed')
    } finally {
      setBusy(false)
    }
  }

  async function unsubscribe() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setStatus('unsubscribed')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading' || status === 'unsupported') return null

  return (
    <div className="relative">
      {status === 'subscribed' ? (
        <button
          onClick={unsubscribe}
          disabled={busy}
          title="關閉推播通知"
          className="text-xl leading-none opacity-60 hover:opacity-100 transition disabled:opacity-30"
        >
          🔔
        </button>
      ) : status === 'denied' ? (
        <span title="通知已被封鎖，請在瀏覽器設定中允許" className="text-xl leading-none opacity-30 cursor-not-allowed">
          🔕
        </span>
      ) : (
        <button
          onClick={subscribe}
          disabled={busy}
          title="開啟推播通知"
          className="text-xl leading-none opacity-40 hover:opacity-100 transition disabled:opacity-20"
        >
          🔕
        </button>
      )}

      {showIosHint && (
        <div className="absolute right-0 top-8 w-56 bg-white border border-pink-200 rounded-2xl shadow-lg p-3 z-50 text-xs text-gray-600 leading-relaxed">
          <p className="font-semibold text-pink-600 mb-1">📱 iOS 推播通知</p>
          <p>請先點「分享」→「加入主畫面」，從主畫面開啟 App 後再開啟通知。</p>
          <button
            onClick={() => setShowIosHint(false)}
            className="mt-2 text-pink-400 underline"
          >
            知道了
          </button>
        </div>
      )}
    </div>
  )
}
