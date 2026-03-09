'use client'

import { useRouter } from 'next/navigation'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApprovalStatusBadge } from './approval-status-badge'

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

export interface WorkflowRequest {
  id: string
  targetType: string
  targetName: string
  requestType: string
  requester: { id: string; name: string }
  status: string
  createdAt: string
}

export function WorkflowRequestTable({ requests }: { requests: WorkflowRequest[] }) {
  const router = useRouter()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>대상 유형</TableHead>
          <TableHead>대상명</TableHead>
          <TableHead>요청 유형</TableHead>
          <TableHead>요청자</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>요청일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              승인 요청이 없습니다
            </TableCell>
          </TableRow>
        ) : (
          requests.map((request) => (
            <TableRow
              key={request.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/workflow/${request.id}`)}
            >
              <TableCell>{targetTypeLabels[request.targetType] || request.targetType}</TableCell>
              <TableCell className="font-medium">{request.targetName}</TableCell>
              <TableCell>{requestTypeLabels[request.requestType] || request.requestType}</TableCell>
              <TableCell>{request.requester.name}</TableCell>
              <TableCell>
                <ApprovalStatusBadge status={request.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(request.createdAt).toLocaleDateString('ko-KR')}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
