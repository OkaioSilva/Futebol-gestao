import { SetPasswordForm } from '@/components/auth/set-password-form'

export default function DefinirSenhaPage() {
  return (
    <div className="max-w-sm mx-auto py-10">
      <h1 className="text-2xl font-display font-semibold text-center mb-1">Definir senha</h1>
      <p className="text-muted text-sm text-center mb-6">Você foi convidado como administrador. Crie sua senha de acesso.</p>
      <SetPasswordForm />
    </div>
  )
}
