'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { WorkflowRequestTable, type WorkflowRequest } from './workflow-request-table'
import { WorkflowTableSkeleton } from './workflow-table-skeleton'

interface WorkflowListClientProps {
  userRoles: string[]
}

export function WorkflowListClient({ userRoles }: WorkflowListClientProps) {
  const canApprove = userRoles.some((r) => ['ADMIN', 'APPROVER'].includes(r))
  const [tab, setTab] = useState('my')
  const [myPage, setMyPage] = useState(1)
  const [pendingPage, setPendingPage] = useState(1)

  const page = tab === 'my' ? myPage : pendingPage
  const setPage = tab === 'my' ? setMyPage : setPendingPage

  const params: Record<string, string> = {
    page: String(page),
    size: '20',
    view: tab,
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.workflow.list(params),
    queryFn: () => {
      const qs = new URLSearchParams(params).toString()
      return apiClient<WorkflowRequest[]>(`/api/workflow?${qs}`)
    },
  })

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v)}>
      <TabsList>
        <TabsTrigger value="my">내 요청</TabsTrigger>
        {canApprove && (
          <TabsTrigger value="pending">승인 대기</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value={tab} className="mt-4">
        {isLoading ? (
          <WorkflowTableSkeleton />
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
            <WorkflowRequestTable requests={data?.data ?? []} />
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
      </TabsContent>
    </Tabs>
  )
}
