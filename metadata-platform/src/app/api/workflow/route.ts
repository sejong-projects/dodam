import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db/prisma'
import { requireAuth } from '@/lib/auth/require-role'
import { getUserRoles } from '@/lib/auth/actions'
import { ApprovalStatus, RoleName, TargetType } from '@/generated/prisma/client'

// GET /api/workflow - 승인 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if ('error' in authResult) return authResult.error

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const size = parseInt(searchParams.get('size') || '20')
    const view = searchParams.get('view') || 'my'
    const status = searchParams.get('status') || undefined

    const where: Record<string, unknown> = {}

    if (view === 'my') {
      where.requesterId = authResult.user.id
    } else if (view === 'pending') {
      const roles = await getUserRoles(authResult.user.id)
      const canApprove = roles.some((r: RoleName) =>
        ([RoleName.ADMIN, RoleName.APPROVER] as RoleName[]).includes(r),
      )
      if (!canApprove) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: '승인 권한이 없습니다' } },
          { status: 403 },
        )
      }
      where.status = ApprovalStatus.PENDING
    }

    if (status) {
      where.status = status as ApprovalStatus
    }

    const [data, total] = await Promise.all([
      prisma.approvalRequest.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.approvalRequest.count({ where }),
    ])

    // Batch-resolve target entity names
    const grouped = new Map<TargetType, string[]>()
    for (const item of data) {
      const ids = grouped.get(item.targetType) || []
      ids.push(item.targetId)
      grouped.set(item.targetType, ids)
    }

    const nameMap = new Map<string, string>()

    if (grouped.has(TargetType.DOMAIN)) {
      const domains = await prisma.standardDomain.findMany({
        where: { id: { in: grouped.get(TargetType.DOMAIN)! } },
        select: { id: true, domainName: true },
      })
      domains.forEach((d) => nameMap.set(d.id, d.domainName))
    }

    if (grouped.has(TargetType.TERM)) {
      const terms = await prisma.standardTerm.findMany({
        where: { id: { in: grouped.get(TargetType.TERM)! } },
        select: { id: true, termName: true },
      })
      terms.forEach((t) => nameMap.set(t.id, t.termName))
    }

    if (grouped.has(TargetType.CODE_GROUP)) {
      const codes = await prisma.codeGroup.findMany({
        where: { id: { in: grouped.get(TargetType.CODE_GROUP)! } },
        select: { id: true, groupName: true },
      })
      codes.forEach((c) => nameMap.set(c.id, c.groupName))
    }

    const enriched = data.map((item) => ({
      ...item,
      targetName: nameMap.get(item.targetId) || '(삭제됨)',
    }))

    return NextResponse.json({
      data: enriched,
      pagination: { page, size, total },
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '승인 요청 목록 조회에 실패했습니다' } },
      { status: 500 },
    )
  }
}
