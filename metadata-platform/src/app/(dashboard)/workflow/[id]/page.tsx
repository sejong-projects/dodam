import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/db/prisma'
import { getSession, hasAnyRole } from '@/lib/auth/get-session'
import { RoleName, TargetType } from '@/generated/prisma/client'
import { ApprovalStatusBadge } from '@/components/workflow/approval-status-badge'
import { ApprovalTimeline } from '@/components/workflow/approval-timeline'
import { WorkflowDetailActions } from '@/components/workflow/workflow-detail-actions'
import { StatusBadge } from '@/components/shared/status-badge'

const targetTypeLabels: Record<string, string> = {
  DOMAIN: '도메인',
  TERM: '표준 용어',
  CODE_GROUP: '코드 그룹',
}

const requestTypeLabels: Record<string, string> = {
  CREATE: '등록',
  UPDATE: '수정',
  DELETE: '삭제',
}

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSession()

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

  if (!request) notFound()

  const canApprove = hasAnyRole(user, [RoleName.ADMIN, RoleName.APPROVER])

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">승인 요청 상세</h2>
        <div className="flex gap-2">
          <WorkflowDetailActions
            requestId={request.id}
            status={request.status}
            canApprove={canApprove}
          />
          <Button variant="outline" asChild>
            <Link href="/workflow">목록</Link>
          </Button>
        </div>
      </div>

      {/* Request Info */}
      <Card>
        <CardHeader>
          <CardTitle>요청 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">대상 유형</p>
              <p className="font-medium">
                {targetTypeLabels[request.targetType] || request.targetType}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">요청 유형</p>
              <p className="font-medium">
                {requestTypeLabels[request.requestType] || request.requestType}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">상태</p>
              <ApprovalStatusBadge status={request.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">요청자</p>
              <p className="font-medium">{request.requester.name}</p>
            </div>
            {request.approver && (
              <div>
                <p className="text-sm text-muted-foreground">승인자</p>
                <p className="font-medium">{request.approver.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">요청일</p>
              <p className="font-medium">
                {new Date(request.createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
          {request.requestComment && (
            <div>
              <p className="text-sm text-muted-foreground">요청 코멘트</p>
              <p className="font-medium">{request.requestComment}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Entity Preview */}
      {target && (
        <Card>
          <CardHeader>
            <CardTitle>대상 정보 미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            {request.targetType === TargetType.DOMAIN && (
              <DomainPreview target={target} />
            )}
            {request.targetType === TargetType.TERM && (
              <TermPreview target={target} />
            )}
            {request.targetType === TargetType.CODE_GROUP && (
              <CodeGroupPreview target={target} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Approval Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>처리 이력</CardTitle>
        </CardHeader>
        <CardContent>
          <ApprovalTimeline entries={request.history} />
        </CardContent>
      </Card>
    </div>
  )
}

function DomainPreview({ target }: { target: Record<string, unknown> }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">도메인명</p>
        <p className="font-medium">{target.domainName as string}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">상태</p>
        <StatusBadge status={target.status as string} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">데이터 타입</p>
        <p className="font-medium">{target.dataType as string}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">길이</p>
        <p className="font-medium">{(target.length as number) ?? '-'}</p>
      </div>
      <div className="col-span-2">
        <p className="text-sm text-muted-foreground">설명</p>
        <p className="font-medium">{target.domainDescription as string}</p>
      </div>
    </div>
  )
}

function TermPreview({ target }: { target: Record<string, unknown> }) {
  const domain = target.domain as { id: string; domainName: string } | null
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">용어명</p>
        <p className="font-medium">{target.termName as string}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">영문 용어명</p>
        <p className="font-medium">{target.termEnglishName as string}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">상태</p>
        <StatusBadge status={target.status as string} />
      </div>
      {domain && (
        <div>
          <p className="text-sm text-muted-foreground">도메인</p>
          <p className="font-medium">{domain.domainName}</p>
        </div>
      )}
      <div className="col-span-2">
        <p className="text-sm text-muted-foreground">설명</p>
        <p className="font-medium">{target.termDescription as string}</p>
      </div>
    </div>
  )
}

function CodeGroupPreview({ target }: { target: Record<string, unknown> }) {
  const items = (target.items as Array<{ id: string; itemCode: string; itemName: string; isActive: boolean }>) || []
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">코드 그룹명</p>
          <p className="font-medium">{target.groupName as string}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">영문명</p>
          <p className="font-medium">{target.groupEnglishName as string}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">상태</p>
          <StatusBadge status={target.status as string} />
        </div>
        <div className="col-span-2">
          <p className="text-sm text-muted-foreground">설명</p>
          <p className="font-medium">{target.groupDescription as string}</p>
        </div>
      </div>
      {items.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">코드 항목 ({items.length})</p>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">코드</th>
                  <th className="px-3 py-2 text-left font-medium">코드명</th>
                  <th className="px-3 py-2 text-left font-medium">활성</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono">{item.itemCode}</td>
                    <td className="px-3 py-2">{item.itemName}</td>
                    <td className="px-3 py-2">{item.isActive ? '예' : '아니오'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
