'use client'

import { useState, useEffect } from 'react'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { AdminUser } from './user-table'

const roleOptions = [
  {
    value: 'ADMIN',
    label: '관리자',
    description: '시스템 전체 관리 및 사용자 역할 변경',
  },
  {
    value: 'STANDARD_MANAGER',
    label: '표준담당자',
    description: '표준 용어, 도메인, 코드 등록 및 수정',
  },
  {
    value: 'APPROVER',
    label: '승인자',
    description: '등록 요청 검토 및 승인/반려',
  },
  {
    value: 'VIEWER',
    label: '조회자',
    description: '데이터 조회만 가능',
  },
] as const

interface RoleEditDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleEditDialog({ user, open, onOpenChange }: RoleEditDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (user) {
      setSelectedRoles([...user.roles])
      setError(null)
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: (roles: string[]) =>
      apiClient(`/api/admin/users/${user!.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ roles }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
      onOpenChange(false)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role],
    )
    setError(null)
  }

  const hasChanges =
    user &&
    (selectedRoles.length !== user.roles.length ||
      selectedRoles.some((r) => !user.roles.includes(r)))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>역할 변경</DialogTitle>
          <DialogDescription>
            {user?.name} ({user?.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {roleOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
            >
              <Checkbox
                checked={selectedRoles.includes(option.value)}
                onCheckedChange={() => handleToggle(option.value)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <div className="text-sm font-medium leading-none">
                  {option.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={() => mutation.mutate(selectedRoles)}
            disabled={mutation.isPending || selectedRoles.length === 0 || !hasChanges}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
