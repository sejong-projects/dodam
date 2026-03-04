import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { SessionUser } from '@/types/auth'
import { RoleName } from '@/generated/prisma/client'
import { getUserRoles } from './actions'

export async function getSession(): Promise<SessionUser> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const roles = await getUserRoles(session.user.id)
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    roles,
  }
}

export function hasRole(user: SessionUser, role: RoleName): boolean {
  return user.roles.includes(role)
}

export function hasAnyRole(user: SessionUser, roles: RoleName[]): boolean {
  return roles.some((role) => user.roles.includes(role))
}
