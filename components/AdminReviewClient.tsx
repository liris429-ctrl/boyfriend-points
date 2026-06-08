'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PointRequest, RewardWish, Redemption } from '@/lib/types'

interface Props {
  requests: PointRequest[]
  wishes: RewardWish[]
  redemptions: Redemption[]
  adminId: string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: '待審核', color: 'text-amber-500 bg-amber-50 border-amber-200' },
  approved: { label: '已核准', color: 'text-green-600 bg-green-50 border-green-200' },
  rejected: { label: '未通過', color: 'text-gray-400 bg-gray-50 border-gray-200' },
}

export default function AdminReviewClient({ requests, wishes, redemptions, adminId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<'requests' | 'wishes' | 'redemptions'>('requests')
  const [fulfillingId, setFulfillingId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  // Request approval state: requestId → { points, reply }
  const [requestEdits, setRequestEdits] = useState<Record<string, { points: string; reply: string }>>({})
  // Wish approval state: wishId → { emoji, pointsReq, reply }
  const [wishEdits, setWishEdits] = useState<Record<string, { emoji: string; pointsReq: string; reply: string }>>({})

  function getRequestEdit(id: string) {
    return requestEdits[id] ?? { points: '', reply: '' }
  }
  function getWishEdit(id: string) {
    return wishEdits[id] ?? { emoji: '', pointsReq: '', reply: '' }
  }

  function setRequestField(id: string, field: 'points' | 'reply', value: string) {
    setRequestEdits((prev) => ({ ...prev, [id]: { ...getRequestEdit(id), [field]: value } }))
  }
  function setWishField(id: string, field: 'emoji' | 'pointsReq' | 'reply', value: string) {
    setWishEdits((prev) => ({ ...prev, [id]: { ...getWishEdit(id), [field]: value } }))
  }

  // ── Requests ──
  async function approveRequest(req: PointRequest) {
    const edit = getRequestEdit(req.id)
    const pts = parseInt(edit.points) || req.points_suggested || 5
    setLoading(req.id)

    const { error: txError } = await supabase.from('point_transactions').insert({
      user_id: req.user_id,
      action_id: null,
      points: pts,
      note: `核准申請：${req.title}`,
      awarded_by: adminId,
    })

    if (!txError) {
      await supabase.from('point_requests').update({
        status: 'approved',
        awarded_points: pts,
        admin_reply: edit.reply.trim() || null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      }).eq('id', req.id)
    }

    setLoading(null)
    router.refresh()
  }

  async function rejectRequest(req: PointRequest) {
    const edit = getRequestEdit(req.id)
    setLoading(`reject-${req.id}`)

    await supabase.from('point_requests').update({
      status: 'rejected',
      admin_reply: edit.reply.trim() || null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    }).eq('id', req.id)

    setLoading(null)
    router.refresh()
  }

  // ── Wishes ──
  async function approveWish(wish: RewardWish) {
    const edit = getWishEdit(wish.id)
    const pts = parseInt(edit.pointsReq)
    if (!pts || pts <= 0) return
    setLoading(wish.id)

    const { error: rwError } = await supabase.from('rewards').insert({
      title: wish.title,
      emoji: edit.emoji.trim() || wish.emoji,
      points_required: pts,
      active: true,
    })

    if (!rwError) {
      await supabase.from('reward_wishes').update({
        status: 'approved',
        admin_reply: edit.reply.trim() || null,
      }).eq('id', wish.id)
    }

    setLoading(null)
    router.refresh()
  }

  async function rejectWish(wish: RewardWish) {
    const edit = getWishEdit(wish.id)
    setLoading(`reject-${wish.id}`)

    await supabase.from('reward_wishes').update({
      status: 'rejected',
      admin_reply: edit.reply.trim() || null,
    }).eq('id', wish.id)

    setLoading(null)
    router.refresh()
  }

  async function fulfillRedemption(redemption: Redemption) {
    setFulfillingId(redemption.id)
    await supabase.from('redemptions').update({
      fulfilled: true,
      fulfilled_at: new Date().toISOString(),
    }).eq('id', redemption.id)
    setFulfillingId(null)
    router.refresh()
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const pendingWishes = wishes.filter((w) => w.status === 'pending')
  const unfulfilled = redemptions.filter((r) => !r.fulfilled)

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex bg-white rounded-2xl border border-pink-100 overflow-hidden">
        <button
          onClick={() => setTab('requests')}
          className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
            tab === 'requests'
              ? 'text-pink-600 bg-pink-50 border-b-2 border-pink-500'
              : 'text-gray-400 hover:text-pink-400'
          }`}
        >
          🙋 申請給點
          {pendingRequests.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('wishes')}
          className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
            tab === 'wishes'
              ? 'text-pink-600 bg-pink-50 border-b-2 border-pink-500'
              : 'text-gray-400 hover:text-pink-400'
          }`}
        >
          ✨ 許願獎勵
          {pendingWishes.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {pendingWishes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('redemptions')}
          className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
            tab === 'redemptions'
              ? 'text-pink-600 bg-pink-50 border-b-2 border-pink-500'
              : 'text-gray-400 hover:text-pink-400'
          }`}
        >
          🎁 待兌現
          {unfulfilled.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {unfulfilled.length}
            </span>
          )}
        </button>
      </div>

      {/* Requests list */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center text-pink-300">
              <div className="text-4xl mb-2">🌸</div>
              <p className="text-sm">還沒有申請紀錄</p>
            </div>
          ) : (
            requests.map((req) => {
              const st = STATUS_LABEL[req.status] ?? STATUS_LABEL.pending
              const edit = getRequestEdit(req.id)
              const isPending = req.status === 'pending'

              return (
                <div key={req.id} className="bg-white rounded-2xl border border-pink-100 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🙋</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-gray-700">{req.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-pink-400 mt-0.5">
                        {req.profiles?.display_name} ·{' '}
                        建議 {req.points_suggested ? `+${req.points_suggested} 分` : '未填'}
                      </p>
                      {req.reason && <p className="text-xs text-gray-400 mt-0.5">{req.reason}</p>}
                      {req.admin_reply && !isPending && (
                        <p className="text-xs text-pink-500 mt-1 italic">你回覆：{req.admin_reply}</p>
                      )}
                      {req.awarded_points && req.status === 'approved' && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">實際給予 +{req.awarded_points} 分</p>
                      )}
                    </div>
                  </div>

                  {isPending && (
                    <div className="space-y-2 border-t border-pink-50 pt-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-pink-400">給予分數</label>
                          <div className="relative mt-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pink-400 text-xs">+</span>
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={edit.points}
                              onChange={(e) => setRequestField(req.id, 'points', e.target.value)}
                              placeholder={req.points_suggested?.toString() ?? '10'}
                              className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-pink-200 text-xs focus:outline-none focus:border-pink-400"
                            />
                          </div>
                        </div>
                        <div className="flex-[2]">
                          <label className="text-xs text-pink-400">回覆（選填）</label>
                          <input
                            type="text"
                            value={edit.reply}
                            onChange={(e) => setRequestField(req.id, 'reply', e.target.value)}
                            maxLength={60}
                            placeholder="加油！繼續保持 💪"
                            className="w-full mt-1 px-2 py-1.5 rounded-lg border border-pink-200 text-xs focus:outline-none focus:border-pink-400"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveRequest(req)}
                          disabled={loading === req.id}
                          className="flex-1 py-2 rounded-xl bg-pink-500 text-white text-xs font-semibold hover:bg-pink-600 transition disabled:opacity-50"
                        >
                          {loading === req.id ? '處理中...' : '✅ 核准'}
                        </button>
                        <button
                          onClick={() => rejectRequest(req)}
                          disabled={loading === `reject-${req.id}`}
                          className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                        >
                          {loading === `reject-${req.id}` ? '處理中...' : '❌ 拒絕'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Wishes list */}
      {tab === 'wishes' && (
        <div className="space-y-3">
          {wishes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center text-pink-300">
              <div className="text-4xl mb-2">🌸</div>
              <p className="text-sm">還沒有許願紀錄</p>
            </div>
          ) : (
            wishes.map((wish) => {
              const st = STATUS_LABEL[wish.status] ?? STATUS_LABEL.pending
              const edit = getWishEdit(wish.id)
              const isPending = wish.status === 'pending'

              return (
                <div key={wish.id} className="bg-white rounded-2xl border border-pink-100 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{wish.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-gray-700">{wish.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-pink-400 mt-0.5">{wish.profiles?.display_name}</p>
                      {wish.reason && <p className="text-xs text-gray-400 mt-0.5">{wish.reason}</p>}
                      {wish.admin_reply && !isPending && (
                        <p className="text-xs text-pink-500 mt-1 italic">你回覆：{wish.admin_reply}</p>
                      )}
                    </div>
                  </div>

                  {isPending && (
                    <div className="space-y-2 border-t border-pink-50 pt-3">
                      <div className="flex gap-2">
                        <div className="w-16">
                          <label className="text-xs text-pink-400">表情</label>
                          <input
                            type="text"
                            value={edit.emoji}
                            onChange={(e) => setWishField(wish.id, 'emoji', e.target.value)}
                            maxLength={2}
                            placeholder={wish.emoji}
                            className="w-full mt-1 px-2 py-1.5 rounded-lg border border-pink-200 text-center text-base focus:outline-none focus:border-pink-400"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-pink-400">所需積分 *</label>
                          <input
                            type="number"
                            min="1"
                            max="9999"
                            value={edit.pointsReq}
                            onChange={(e) => setWishField(wish.id, 'pointsReq', e.target.value)}
                            placeholder="30"
                            className="w-full mt-1 px-2 py-1.5 rounded-lg border border-pink-200 text-xs focus:outline-none focus:border-pink-400"
                          />
                        </div>
                        <div className="flex-[2]">
                          <label className="text-xs text-pink-400">回覆（選填）</label>
                          <input
                            type="text"
                            value={edit.reply}
                            onChange={(e) => setWishField(wish.id, 'reply', e.target.value)}
                            maxLength={60}
                            placeholder="好主意！加進去了 🎁"
                            className="w-full mt-1 px-2 py-1.5 rounded-lg border border-pink-200 text-xs focus:outline-none focus:border-pink-400"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveWish(wish)}
                          disabled={!edit.pointsReq || loading === wish.id}
                          className="flex-1 py-2 rounded-xl bg-pink-500 text-white text-xs font-semibold hover:bg-pink-600 transition disabled:opacity-50"
                        >
                          {loading === wish.id ? '處理中...' : '✅ 核准並上架'}
                        </button>
                        <button
                          onClick={() => rejectWish(wish)}
                          disabled={loading === `reject-${wish.id}`}
                          className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                        >
                          {loading === `reject-${wish.id}` ? '處理中...' : '❌ 拒絕'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Redemptions tab */}
      {tab === 'redemptions' && (
        <div className="space-y-3">
          {redemptions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center text-pink-300">
              <div className="text-4xl mb-2">🎁</div>
              <p className="text-sm">還沒有兌換紀錄</p>
            </div>
          ) : (
            redemptions.map((rd) => (
              <div key={rd.id} className="bg-white rounded-2xl border border-pink-100 p-4 flex items-center gap-3">
                <div className="text-2xl">{rd.reward_emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-700">{rd.reward_title}</p>
                  <p className="text-xs text-pink-400">{rd.profiles?.display_name} · 花了 {rd.points_spent} 分</p>
                  <p className="text-xs text-pink-300">
                    {new Date(rd.created_at).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })}
                  </p>
                  {rd.fulfilled && (
                    <p className="text-xs text-green-500 mt-0.5">✅ 已兌現 {rd.fulfilled_at ? new Date(rd.fulfilled_at).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }) : ''}</p>
                  )}
                </div>
                {!rd.fulfilled ? (
                  <button
                    onClick={() => fulfillRedemption(rd)}
                    disabled={fulfillingId === rd.id}
                    className="text-xs px-3 py-1.5 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition disabled:opacity-50 shrink-0"
                  >
                    {fulfillingId === rd.id ? '...' : '標記已兌現'}
                  </button>
                ) : (
                  <span className="text-xs text-green-400 shrink-0">✅ 已兌現</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
