'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'

interface WorkflowDetailActionsProps {
  requestId: string
  status: string
  canApprove: boolean
}

export function WorkflowDetailActions({
  requestId,
  status,
  canApprove,
}: WorkflowDetailActionsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [rejectError, setRejectError] = useState('')

  const approveMutation = useMutation({
    mutationFn: () =>
      apiClient(`/api/workflow/${requestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.all })
      router.refresh()
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (comment: string) =>
      apiClient(`/api/workflow/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),
    onSuccess: () => {
      setShowRejectDialog(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.all })
      router.refresh()
    },
  })

  if (!canApprove || status !== 'PENDING') return null

  function handleReject() {
    if (!rejectComment.trim()) {
      setRejectError('반려 사유를 입력하세요')
      return
    }
    setRejectError('')
    rejectMutation.mutate(rejectComment)
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => approveMutation.mutate()}
          disabled={approveMutation.isPending}
        >
          {approveMutation.isPending ? '처리 중...' : '승인'}
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowRejectDialog(true)}
          disabled={rejectMutation.isPending}
        >
          반려
        </Button>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>반려 사유 입력</DialogTitle>
            <DialogDescription>
              반려 사유를 입력해주세요. 요청자에게 전달됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="반려 사유를 입력하세요..."
              value={rejectComment}
              onChange={(e) => {
                setRejectComment(e.target.value)
                if (rejectError) setRejectError('')
              }}
              rows={4}
            />
            {rejectError && (
              <p className="text-sm text-destructive">{rejectError}</p>
            )}
            {rejectMutation.isError && (
              <p className="text-sm text-destructive">
                {rejectMutation.error instanceof Error
                  ? rejectMutation.error.message
                  : '반려 처리에 실패했습니다'}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={rejectMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? '처리 중...' : '반려 확인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
