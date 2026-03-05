import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { RoleName } from '@/generated/prisma/client'
import { getUserRoles } from './actions'

export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { error: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 }) }
  }
  return { session, user: session.user }
}

export async function requireRole(requiredRoles: RoleName[]) {
  const result = await requireAuth()
  if ('error' in result) return result

  const roles = await getUserRoles(result.user.id)
  const hasAccess = requiredRoles.some((role) => roles.includes(role))

  if (!hasAccess) {
    return { error: NextResponse.json({ error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } }, { status: 403 }) }
  }

  return { session: result.session, user: result.user, roles }
}
