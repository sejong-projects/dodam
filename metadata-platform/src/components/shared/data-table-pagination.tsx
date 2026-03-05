'use client'

import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  size: number
  total: number
  onPageChange: (page: number) => void
}

export function DataTablePagination({ page, size, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / size)

  return (
    <div className="flex items-center justify-between py-4">
      <p className="text-sm text-muted-foreground">
        총 {total}건 중 {(page - 1) * size + 1}-{Math.min(page * size, total)}건
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          이전
        </Button>
        <span className="flex items-center text-sm">
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          다음
        </Button>
      </div>
    </div>
  )
}
