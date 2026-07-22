import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto py-10">
      <h1 className="text-2xl font-display font-semibold text-center mb-1">Entrar</h1>
      <p className="text-muted text-sm text-center mb-6">Acesso exclusivo para administradores.</p>
      <LoginForm />
    </div>
  )
}
