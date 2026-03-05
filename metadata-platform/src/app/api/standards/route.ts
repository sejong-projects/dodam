import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth, requireRole } from '@/lib/auth/require-role'
import { termCreateSchema } from '@/lib/validations/standard'
import { RoleName } from '@/generated/prisma/client'

// GET /api/standards - 표준 용어 목록 조회
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
          { termName: { contains: search, mode: 'insensitive' as const } },
          { termEnglishName: { contains: search, mode: 'insensitive' as const } },
          { termDescription: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(status && { status: status as 'DRAFT' | 'ACTIVE' | 'DEPRECATED' }),
    }

    const [data, total] = await Promise.all([
      prisma.standardTerm.findMany({
        where,
        include: {
          domain: { select: { id: true, domainName: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.standardTerm.count({ where }),
    ])

    return NextResponse.json({
      data,
      pagination: { page, size, total },
    })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '표준 용어 목록 조회에 실패했습니다' } },
      { status: 500 },
    )
  }
}

// POST /api/standards - 표준 용어 등록
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
    if ('error' in authResult) return authResult.error

    const body = await request.json()
    const parsed = termCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const existing = await prisma.standardTerm.findFirst({
      where: { termName: parsed.data.termName, version: 1 },
    })

    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: '이미 존재하는 용어명입니다' } },
        { status: 409 },
      )
    }

    const term = await prisma.standardTerm.create({
      data: {
        ...parsed.data,
        createdBy: authResult.user.id,
      },
    })

    return NextResponse.json({ data: term }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '표준 용어 등록에 실패했습니다' } },
      { status: 500 },
    )
  }
}
