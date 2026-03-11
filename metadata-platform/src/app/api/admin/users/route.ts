import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { RoleName } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole([RoleName.ADMIN])
    if ('error' in authResult) return authResult.error

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20') || 20))
    const search = (searchParams.get('search') || '').slice(0, 200)

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          roles: { include: { role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.user.count({ where }),
    ])

    const users = data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      status: user.status,
      roles: user.roles.map((ur) => ur.role.name),
      createdAt: user.createdAt.toISOString(),
    }))

    return NextResponse.json({
      data: users,
      pagination: { page, size, total },
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '사용자 목록 조회에 실패했습니다' } },
      { status: 500 },
    )
  }
}
