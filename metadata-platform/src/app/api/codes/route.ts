import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth, requireRole } from '@/lib/auth/require-role'
import { codeGroupCreateSchema } from '@/lib/validations/code'
import { RoleName } from '@/generated/prisma/client'

// GET /api/codes - 코드 그룹 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return authResult.error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || undefined

    const where = {
      ...(search && {
        OR: [
          { groupName: { contains: search, mode: 'insensitive' as const } },
          { groupEnglishName: { contains: search, mode: 'insensitive' as const } },
          { groupDescription: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(status && { status: status as 'DRAFT' | 'ACTIVE' | 'DEPRECATED' }),
    }

    const [data, total] = await Promise.all([
      prisma.codeGroup.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.codeGroup.count({ where }),
    ])

    return NextResponse.json({
      data,
      pagination: { page, size, total },
    })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '코드 그룹 목록 조회에 실패했습니다' } },
      { status: 500 },
    )
  }
}

// POST /api/codes - 코드 그룹 등록
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
    if ('error' in authResult) return authResult.error

    const body = await request.json()
    const parsed = codeGroupCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const { items, ...groupData } = parsed.data

    // Check duplicate groupName
    const existingName = await prisma.codeGroup.findUnique({
      where: { groupName: groupData.groupName },
    })
    if (existingName) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: '이미 존재하는 코드 그룹명입니다' } },
        { status: 409 },
      )
    }

    const codeGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.codeGroup.create({
        data: {
          ...groupData,
          createdBy: authResult.user.id,
        },
      })

      if (items.length > 0) {
        await tx.codeItem.createMany({
          data: items.map((item, index) => ({
            ...item,
            sortOrder: item.sortOrder ?? index,
            groupId: group.id,
          })),
        })
      }

      return tx.codeGroup.findUnique({
        where: { id: group.id },
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          creator: { select: { id: true, name: true } },
        },
      })
    })

    return NextResponse.json({ data: codeGroup }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '코드 그룹 등록에 실패했습니다' } },
      { status: 500 },
    )
  }
}
