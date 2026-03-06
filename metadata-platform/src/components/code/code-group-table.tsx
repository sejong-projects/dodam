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
import { StatusBadge } from '@/components/shared/status-badge'

export interface CodeGroup {
  id: string
  groupName: string
  groupEnglishName: string
  status: string
  creator: { name: string }
  createdAt: string
  _count: { items: number }
}

export function CodeGroupTable({ codeGroups }: { codeGroups: CodeGroup[] }) {
  const router = useRouter()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>코드 그룹명</TableHead>
          <TableHead>영문명</TableHead>
          <TableHead>코드 항목 수</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>등록자</TableHead>
          <TableHead>등록일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {codeGroups.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              등록된 코드 그룹이 없습니다
            </TableCell>
          </TableRow>
        ) : (
          codeGroups.map((group) => (
            <TableRow
              key={group.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/codes/${group.id}`)}
            >
              <TableCell className="font-medium">{group.groupName}</TableCell>
              <TableCell>{group.groupEnglishName}</TableCell>
              <TableCell>{group._count.items}개</TableCell>
              <TableCell><StatusBadge status={group.status} /></TableCell>
              <TableCell>{group.creator.name}</TableCell>
              <TableCell>{new Date(group.createdAt).toLocaleDateString('ko-KR')}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
