import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/require-role'
import { TargetType } from '@/generated/prisma/client'

// GET /api/workflow/[id] - 승인 요청 상세 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return authResult.error

    const { id } = await params

    const request = await prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        history: {
          include: {
            actor: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!request) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '승인 요청을 찾을 수 없습니다' } },
        { status: 404 },
      )
    }

    // Fetch target entity for preview
    let target: Record<string, unknown> | null = null

    switch (request.targetType) {
      case TargetType.DOMAIN:
        target = await prisma.standardDomain.findUnique({
          where: { id: request.targetId },
          select: {
            id: true,
            domainName: true,
            domainDescription: true,
            dataType: true,
            length: true,
            scale: true,
            status: true,
          },
        })
        break
      case TargetType.TERM:
        target = await prisma.standardTerm.findUnique({
          where: { id: request.targetId },
          select: {
            id: true,
            termName: true,
            termEnglishName: true,
            termDescription: true,
            status: true,
            domain: { select: { id: true, domainName: true } },
          },
        })
        break
      case TargetType.CODE_GROUP:
        target = await prisma.codeGroup.findUnique({
          where: { id: request.targetId },
          select: {
            id: true,
            groupName: true,
            groupEnglishName: true,
            groupDescription: true,
            status: true,
            items: {
              select: { id: true, itemCode: true, itemName: true, isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        })
        break
    }

    return NextResponse.json({
      data: { ...request, target },
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '승인 요청 상세 조회에 실패했습니다' } },
      { status: 500 },
    )
  }
}
