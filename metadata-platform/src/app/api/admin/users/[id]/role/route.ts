import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db/prisma'
import { requireRole } from '@/lib/auth/require-role'
import { roleUpdateSchema } from '@/lib/validations/admin'
import { RoleName } from '@/generated/prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole([RoleName.ADMIN])
    if ('error' in authResult) return authResult.error

    const { id: userId } = await params

    const body = await request.json()
    const parsed = roleUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    // Self-lockout prevention: cannot remove own ADMIN role
    if (authResult.user.id === userId && !parsed.data.roles.includes(RoleName.ADMIN)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '자신의 관리자 역할은 제거할 수 없습니다' } },
        { status: 400 },
      )
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다' } },
        { status: 404 },
      )
    }

    // Get role IDs for requested role names
    const roles = await prisma.role.findMany({
      where: { name: { in: parsed.data.roles } },
    })

    if (roles.length !== parsed.data.roles.length) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 역할이 포함되어 있습니다' } },
        { status: 400 },
      )
    }

    // Transaction: delete existing roles -> create new ones
    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId } }),
      prisma.userRole.createMany({
        data: roles.map((role) => ({ userId, roleId: role.id })),
      }),
    ])

    // Fetch updated user with roles
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    })

    if (!updatedUser) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: '역할 변경 후 사용자 조회에 실패했습니다' } },
        { status: 500 },
      )
    }

    return NextResponse.json({
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        department: updatedUser.department,
        status: updatedUser.status,
        roles: updatedUser.roles.map((ur) => ur.role.name),
        createdAt: updatedUser.createdAt.toISOString(),
      },
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '역할 변경에 실패했습니다' } },
      { status: 500 },
    )
  }
}
