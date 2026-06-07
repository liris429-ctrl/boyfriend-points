'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-red-100 p-6 max-w-sm w-full text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="font-bold text-red-600 mb-2">頁面發生錯誤</h2>
        <pre className="text-xs text-left bg-red-50 rounded-xl p-3 text-red-500 overflow-auto max-h-40 mb-4">
          {error.message}
        </pre>
        <button
          onClick={reset}
          className="w-full py-2 rounded-xl bg-pink-500 text-white text-sm font-semibold"
        >
          重試
        </button>
      </div>
    </div>
  )
}
