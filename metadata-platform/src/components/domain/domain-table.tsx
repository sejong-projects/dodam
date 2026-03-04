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

interface Domain {
  id: string
  domainName: string
  dataType: string
  length: number | null
  status: string
  creator: { name: string }
  createdAt: string
}

export function DomainTable({ domains }: { domains: Domain[] }) {
  const router = useRouter()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>도메인명</TableHead>
          <TableHead>데이터타입</TableHead>
          <TableHead>길이</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>등록자</TableHead>
          <TableHead>등록일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {domains.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              등록된 도메인이 없습니다
            </TableCell>
          </TableRow>
        ) : (
          domains.map((domain) => (
            <TableRow
              key={domain.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/domains/${domain.id}`)}
            >
              <TableCell className="font-medium">{domain.domainName}</TableCell>
              <TableCell>{domain.dataType}</TableCell>
              <TableCell>{domain.length ?? '-'}</TableCell>
              <TableCell><StatusBadge status={domain.status} /></TableCell>
              <TableCell>{domain.creator.name}</TableCell>
              <TableCell>{new Date(domain.createdAt).toLocaleDateString('ko-KR')}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
