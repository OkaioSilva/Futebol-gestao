'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Validando convite...')

  useEffect(() => {
    async function processCallback() {
      const supabase = createClient()

      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        const token = url.searchParams.get('token')
        const hash = window.location.hash || ''

        console.log('auth callback url', { href: window.location.href, search: url.search, hash })

        if (hash.includes('error')) {
          const hashParams = new URLSearchParams(hash.replace('#', ''))
          const error = hashParams.get('error')
          const code = hashParams.get('error_code')
          const description = hashParams.get('error_description')
          console.log('auth callback error hash', { error, code, description })
          const friendly =
            code === 'otp_expired' || error === 'access_denied'
              ? 'Link de convite inválido ou expirado. Solicite um novo convite.'
              : description ?? error
          setMessage(`Erro no link de convite: ${friendly}`)
          return
        }

        // 1) Exchange an OAuth code for a session if present
        if (code && typeof supabase.auth.exchangeCodeForSession === 'function') {
          const { data: codeData, error: codeError } = await supabase.auth.exchangeCodeForSession(code)
          console.log('exchangeCodeForSession', { codeData, codeError })
          if (codeError) {
            setMessage(`Erro ao trocar código por sessão: ${codeError.message}`)
            return
          }
          if (codeData?.session) {
            router.replace('/definir-senha')
            return
          }
        }

        // 2) If tokens were returned in the hash (access_token / refresh_token), set them directly
        if (
          hash.includes('access_token') &&
          typeof supabase.auth.setSession === 'function'
        ) {
          const params = new URLSearchParams(hash.replace('#', ''))
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          console.log('found tokens in hash', {
            access_token: !!access_token,
            refresh_token: !!refresh_token,
          })
          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
            console.log('setSession result', { data, error })
            if (error) {
              setMessage(`Erro ao aplicar sessão: ${error.message}`)
              return
            }
            router.replace('/definir-senha')
            return
          }
        }

        // 3) Try reading the current session if no grant was exchanged explicitly
        if (typeof supabase.auth.getSession === 'function') {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          console.log('getSession fallback', { sessionData, sessionError })
          if (sessionError) {
            setMessage(`Erro ao buscar sessão: ${sessionError.message}`)
            return
          }
          if (sessionData?.session) {
            router.replace('/definir-senha')
            return
          }
        }

        // 4) As a last resort, if there is a token param (invite flow), try a simple retry message
        if (token) {
          console.log('invite token present in query, waiting for Supabase verify redirect to finish')
          setMessage('Validando convite... aguarde alguns segundos e recarregue se necessário.')
          return
        }

        setMessage('Não foi possível validar o convite automaticamente. Tente usar o link do e-mail novamente.')
      } catch (err: any) {
        setMessage(`Erro inesperado: ${err?.message ?? String(err)}`)
      }
    }

    processCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-base text-foreground">
      <div className="max-w-lg rounded-3xl border border-border bg-surface p-8 text-center shadow-xl">
        <h1 className="text-2xl font-semibold mb-4">Redirecionando...</h1>
        <p className="text-sm text-muted">{message}</p>
      </div>
    </div>
  )
}
