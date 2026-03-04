import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAuth, requireRole } from '@/lib/auth/require-role'
import { termUpdateSchema } from '@/lib/validations/standard'
import { RoleName } from '@/generated/prisma/client'

// GET /api/standards/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return authResult.error

    const { id } = await params
    const term = await prisma.standardTerm.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        domain: { select: { id: true, domainName: true, dataType: true } },
      },
    })

    if (!term) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '표준 용어를 찾을 수 없습니다' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: term })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '표준 용어 조회에 실패했습니다' } },
      { status: 500 },
    )
  }
}

// PUT /api/standards/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
    if ('error' in authResult) return authResult.error

    const { id } = await params
    const body = await request.json()
    const parsed = termUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const term = await prisma.standardTerm.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ data: term })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '표준 용어 수정에 실패했습니다' } },
      { status: 500 },
    )
  }
}

// DELETE /api/standards/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.STANDARD_MANAGER])
    if ('error' in authResult) return authResult.error

    const { id } = await params
    await prisma.standardTerm.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '표준 용어 삭제에 실패했습니다' } },
      { status: 500 },
    )
  }
}
