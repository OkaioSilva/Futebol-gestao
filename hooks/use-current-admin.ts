'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export function useCurrentAdmin() {
  const [admin, setAdmin] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (mounted) {
          setAdmin(null)
          setLoading(false)
        }
        return
      }

      const { data } = await supabase.from('profiles').select('id, email, full_name').eq('id', user.id).maybeSingle()
      if (mounted) {
        setAdmin(data as Profile | null)
        setLoading(false)
      }
    }

    load()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => load())

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { admin, isAdmin: !!admin, loading }
}
