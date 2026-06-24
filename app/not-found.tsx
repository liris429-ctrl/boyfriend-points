import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-pink-50">
      <div className="text-center">
        <div className="text-7xl mb-4">💔</div>
        <h1 className="text-2xl font-bold text-pink-700 mb-2">找不到這一頁</h1>
        <p className="text-pink-400 text-sm mb-6">這個頁面不存在或已被移除</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-xl bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 active:scale-95 transition-all"
        >
          回首頁
        </Link>
      </div>
    </div>
  )
}
