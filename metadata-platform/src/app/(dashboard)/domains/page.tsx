'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DomainTable, type Domain } from '@/components/domain/domain-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'

export default function DomainsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')

  const params: Record<string, string> = { page: String(page), size: '20' }
  if (search) params.search = search
  if (status !== 'all') params.status = status

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.domains.list(params),
    queryFn: () => {
      const qs = new URLSearchParams(params).toString()
      return apiClient<Domain[]>(`/api/domains?${qs}`)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">표준 도메인</h2>
        <Button asChild>
          <Link href="/domains/new">도메인 등록</Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="도메인명 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="DRAFT">초안</SelectItem>
            <SelectItem value="ACTIVE">활성</SelectItem>
            <SelectItem value="DEPRECATED">폐기</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : (
        <>
          <DomainTable domains={data?.data ?? []} />
          {data?.pagination && (
            <DataTablePagination
              page={data.pagination.page}
              size={data.pagination.size}
              total={data.pagination.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}
