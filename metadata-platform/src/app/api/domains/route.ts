import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db/prisma'
import { requireAuth, requireRole } from '@/lib/auth/require-role'
import { domainCreateSchema } from '@/lib/validations/domain'
import { createApprovalRequest } from '@/lib/workflow/approval-service'
import { RoleName } from '@/generated/prisma/client'

// GET /api/domains - 목록 조회
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
          { domainName: { contains: search, mode: 'insensitive' as const } },
          { domainDescription: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(status && { status: status as 'DRAFT' | 'ACTIVE' | 'DEPRECATED' }),
    }

    const [data, total] = await Promise.all([
      prisma.standardDomain.findMany({
        where,
        include: { creator: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.standardDomain.count({ where }),
    ])

    return NextResponse.json({
      data,
      pagination: { page, size, total },
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '도메인 목록 조회에 실패했습니다' } },
      { status: 500 },
    )
  }
}

// POST /api/domains - 등록
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
    if ('error' in authResult) return authResult.error

    const body = await request.json()
    const parsed = domainCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const existing = await prisma.standardDomain.findUnique({
      where: { domainName: parsed.data.domainName },
    })

    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: '이미 존재하는 도메인명입니다' } },
        { status: 409 },
      )
    }

    const domain = await prisma.standardDomain.create({
      data: {
        ...parsed.data,
        createdBy: authResult.user.id,
      },
    })

    await createApprovalRequest({
      targetType: 'DOMAIN',
      targetId: domain.id,
      requestType: 'CREATE',
      requesterId: authResult.user.id,
    })

    return NextResponse.json({ data: domain }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '도메인 등록에 실패했습니다' } },
      { status: 500 },
    )
  }
}
