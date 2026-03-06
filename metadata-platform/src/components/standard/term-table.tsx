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

export interface Term {
  id: string
  termName: string
  termEnglishName: string
  termAbbreviation: string | null
  domain: { domainName: string }
  status: string
  creator: { name: string }
  createdAt: string
}

export function TermTable({ terms }: { terms: Term[] }) {
  const router = useRouter()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>용어명</TableHead>
          <TableHead>영문명</TableHead>
          <TableHead>약어</TableHead>
          <TableHead>도메인</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>등록자</TableHead>
          <TableHead>등록일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {terms.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              등록된 표준 용어가 없습니다
            </TableCell>
          </TableRow>
        ) : (
          terms.map((term) => (
            <TableRow
              key={term.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/standards/${term.id}`)}
            >
              <TableCell className="font-medium">{term.termName}</TableCell>
              <TableCell>{term.termEnglishName}</TableCell>
              <TableCell>{term.termAbbreviation ?? '-'}</TableCell>
              <TableCell>{term.domain.domainName}</TableCell>
              <TableCell><StatusBadge status={term.status} /></TableCell>
              <TableCell>{term.creator.name}</TableCell>
              <TableCell>{new Date(term.createdAt).toLocaleDateString('ko-KR')}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
