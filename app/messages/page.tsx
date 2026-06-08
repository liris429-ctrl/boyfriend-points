import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import MessagesClient from '@/components/MessagesClient'
import type { Message } from '@/lib/types'

export default async function MessagesPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw new Error(`Auth error: ${authError.message}`)
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profileError) throw new Error(`Profile error: ${profileError.message}`)
  if (!profile) redirect('/login')

  const { data: messages } = await supabase
    .from('messages')
    .select('*, profiles!messages_sender_id_fkey(display_name, role)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={profile.role} displayName={profile.display_name} />

      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-24 space-y-5">
        <div className="mt-2">
          <h1 className="text-xl font-bold text-pink-700 flex items-center gap-2">
            <span>💬</span> 留言板
          </h1>
          <p className="text-sm text-pink-400 mt-0.5">說說今天的心情</p>
        </div>

        <MessagesClient
          messages={(messages ?? []) as Message[]}
          userId={user.id}
          userRole={profile.role}
        />
      </main>
    </div>
  )
}
