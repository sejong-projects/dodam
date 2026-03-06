import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth, requireRole } from '@/lib/auth/require-role'
import { domainUpdateSchema } from '@/lib/validations/domain'
import { RoleName } from '@/generated/prisma/client'

// GET /api/domains/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return authResult.error

    const { id } = await params
    const domain = await prisma.standardDomain.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        terms: { select: { id: true, termName: true, status: true } },
      },
    })

    if (!domain) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '도메인을 찾을 수 없습니다' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: domain })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '도메인 조회에 실패했습니다' } },
      { status: 500 },
    )
  }
}

// PUT /api/domains/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
    if ('error' in authResult) return authResult.error

    const { id } = await params
    const body = await request.json()
    const parsed = domainUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const domain = await prisma.standardDomain.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ data: domain })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '도메인 수정에 실패했습니다' } },
      { status: 500 },
    )
  }
}

// DELETE /api/domains/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
    if ('error' in authResult) return authResult.error

    const { id } = await params

    const termCount = await prisma.standardTerm.count({ where: { domainId: id } })
    if (termCount > 0) {
      return NextResponse.json(
        { error: { code: 'HAS_DEPENDENCIES', message: `이 도메인에 연결된 표준 용어가 ${termCount}개 있습니다. 먼저 용어를 제거해주세요.` } },
        { status: 409 },
      )
    }

    await prisma.standardDomain.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '도메인 삭제에 실패했습니다' } },
      { status: 500 },
    )
  }
}
