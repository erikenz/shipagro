'use server'

import config from '@payload-config'
import { login, logout } from '@payloadcms/next/auth'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { FormState } from '../forms'
import { TENANT_COOKIE, getPanelContext } from '../session'

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get('email') ?? '').trim()
  const password = String(form.get('password') ?? '')
  if (!email || !password) return { error: 'Ingresá tu email y contraseña.' }
  try {
    await login({ collection: 'users', config, email, password })
  } catch {
    return { error: 'El email o la contraseña no son correctos.' }
  }
  redirect('/')
}

export async function logoutAction() {
  await logout({ config })
  redirect('/login')
}

export async function selectTenantAction(tenantID: number) {
  const { tenants } = await getPanelContext()
  if (!tenants.some((t) => t.id === tenantID)) return
  // The v0 preview is a cross-site iframe, where only SameSite=None cookies come back.
  const crossSite = Boolean(process.env.V0_SANDBOX_URL)
  ;(await cookies()).set(TENANT_COOKIE, String(tenantID), {
    path: '/',
    sameSite: crossSite ? 'none' : 'lax',
    secure: crossSite || process.env.NODE_ENV === 'production',
  })
  revalidatePath('/', 'layout')
}
