import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth, requireRole } from '@/lib/auth/require-role'
import { codeGroupUpdateSchema } from '@/lib/validations/code'
import { RoleName } from '@/generated/prisma/client'

// GET /api/codes/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return authResult.error

    const { id } = await params
    const codeGroup = await prisma.codeGroup.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!codeGroup) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '코드 그룹을 찾을 수 없습니다' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: codeGroup })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '코드 그룹 조회에 실패했습니다' } },
      { status: 500 },
    )
  }
}

// PUT /api/codes/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
    if ('error' in authResult) return authResult.error

    const { id } = await params
    const body = await request.json()
    const parsed = codeGroupUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const existing = await prisma.codeGroup.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '코드 그룹을 찾을 수 없습니다' } },
        { status: 404 },
      )
    }

    const { items, ...groupData } = parsed.data

    // Check duplicate groupName (exclude self)
    if (groupData.groupName && groupData.groupName !== existing.groupName) {
      const duplicateName = await prisma.codeGroup.findUnique({
        where: { groupName: groupData.groupName },
      })
      if (duplicateName) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE', message: '이미 존재하는 코드 그룹명입니다' } },
          { status: 409 },
        )
      }
    }

    const codeGroup = await prisma.$transaction(async (tx) => {
      await tx.codeGroup.update({
        where: { id },
        data: groupData,
      })

      // Delete-and-recreate items
      await tx.codeItem.deleteMany({ where: { groupId: id } })

      if (items.length > 0) {
        await tx.codeItem.createMany({
          data: items.map((item, index) => ({
            ...item,
            sortOrder: item.sortOrder ?? index,
            groupId: id,
          })),
        })
      }

      return tx.codeGroup.findUnique({
        where: { id },
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          creator: { select: { id: true, name: true } },
        },
      })
    })

    return NextResponse.json({ data: codeGroup })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '코드 그룹 수정에 실패했습니다' } },
      { status: 500 },
    )
  }
}

// DELETE /api/codes/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
    if ('error' in authResult) return authResult.error

    const { id } = await params

    const existing = await prisma.codeGroup.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '코드 그룹을 찾을 수 없습니다' } },
        { status: 404 },
      )
    }

    await prisma.codeGroup.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '코드 그룹 삭제에 실패했습니다' } },
      { status: 500 },
    )
  }
}
