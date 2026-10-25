import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Brand } from '@/components/panel/brand'
import { LoginForm } from '@/components/panel/login-form'
import { getCurrentUser } from '@/panel/session'

export const metadata: Metadata = { title: 'Ingresar' }

export default async function LoginPage() {
  const { user } = await getCurrentUser()
  if (user) redirect('/')

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12">
      <Brand />
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-balance">Ingresá a tu mesa</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Usá el email y la contraseña que te dio el Administrador de tu Empresa.
          </p>
        </div>
        <LoginForm />
      </div>
      <p className="max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
        Los precios provienen de reMarkets, el entorno de prueba de A3 Mercados. No se ejecutan
        órdenes.
      </p>
    </main>
  )
}
