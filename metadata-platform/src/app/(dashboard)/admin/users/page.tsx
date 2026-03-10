import { redirect } from 'next/navigation'

import { getSession, hasRole } from '@/lib/auth/get-session'
import { RoleName } from '@/generated/prisma/client'
import { AdminUsersClient } from '@/components/admin/admin-users-client'

export default async function AdminUsersPage() {
  const user = await getSession()
  if (!hasRole(user, RoleName.ADMIN)) redirect('/standards')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">사용자 관리</h2>
        <p className="text-muted-foreground">
          시스템 사용자 목록을 조회하고 역할을 관리합니다
        </p>
      </div>
      <AdminUsersClient />
    </div>
  )
}
