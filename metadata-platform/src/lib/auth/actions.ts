'use server'

import { prisma } from '@/lib/db/prisma'
import { RoleName } from '@/generated/prisma/client'

export async function assignDefaultRole(userId: string) {
  const viewerRole = await prisma.role.findUnique({
    where: { name: RoleName.VIEWER },
  })

  if (viewerRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: viewerRole.id } },
      update: {},
      create: { userId, roleId: viewerRole.id },
    })
  }
}

export async function getUserRoles(userId: string): Promise<RoleName[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  })
  return userRoles.map((ur) => ur.role.name)
}
