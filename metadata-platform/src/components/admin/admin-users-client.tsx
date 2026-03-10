'use client'

import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { UserTable, type AdminUser } from './user-table'
import { UserTableSkeleton } from './user-table-skeleton'
import { RoleEditDialog } from './role-edit-dialog'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import { useDebounce } from '@/hooks/use-debounce'

export function AdminUsersClient() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const params: Record<string, string> = { page: String(page), size: '20' }
  if (debouncedSearch) params.search = debouncedSearch

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => {
      const qs = new URLSearchParams(params).toString()
      return apiClient<AdminUser[]>(`/api/admin/users?${qs}`)
    },
  })

  const handleEditRole = (user: AdminUser) => {
    setEditingUser(user)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="이름 또는 이메일 검색..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="pl-9 pr-9"
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => { setSearch(''); setPage(1) }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <UserTableSkeleton />
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
          <UserTable users={data?.data ?? []} onEditRole={handleEditRole} />
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

      <RoleEditDialog
        user={editingUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
