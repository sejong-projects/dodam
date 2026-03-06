'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { CodeGroupTable, type CodeGroup } from '@/components/code/code-group-table'
import { CodeGroupTableSkeleton } from '@/components/code/code-group-table-skeleton'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import { useDebounce } from '@/hooks/use-debounce'

export default function CodesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')
  const debouncedSearch = useDebounce(search, 300)

  const params: Record<string, string> = { page: String(page), size: '20' }
  if (debouncedSearch) params.search = debouncedSearch
  if (status !== 'all') params.status = status

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.codes.list(params),
    queryFn: () => {
      const qs = new URLSearchParams(params).toString()
      return apiClient<CodeGroup[]>(`/api/codes?${qs}`)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">표준 코드</h2>
        <Button asChild>
          <Link href="/codes/new">코드 그룹 등록</Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="코드 그룹명 검색..."
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
        <CodeGroupTableSkeleton />
      ) : isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류 발생</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : '데이터를 불러오는 데 실패했습니다'}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <CodeGroupTable codeGroups={data?.data ?? []} />
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
