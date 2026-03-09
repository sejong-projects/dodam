import { NextRequest, NextResponse } from 'next/server'

import { requireRole } from '@/lib/auth/require-role'
import { approveSchema } from '@/lib/validations/workflow'
import { approveRequest } from '@/lib/workflow/approval-service'
import { RoleName } from '@/generated/prisma/client'

// POST /api/workflow/[id]/approve - 승인
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireRole([RoleName.ADMIN, RoleName.APPROVER])
    if ('error' in authResult) return authResult.error

    const { id } = await params
    const body = await request.json()
    const parsed = approveSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const result = await approveRequest(id, authResult.user.id, parsed.data.comment)

    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: '승인 요청을 찾을 수 없습니다' } },
          { status: 404 },
        )
      }
      if (error.message === 'ALREADY_PROCESSED') {
        return NextResponse.json(
          { error: { code: 'DUPLICATE', message: '이미 처리된 요청입니다' } },
          { status: 409 },
        )
      }
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '승인 처리에 실패했습니다' } },
      { status: 500 },
    )
  }
}
