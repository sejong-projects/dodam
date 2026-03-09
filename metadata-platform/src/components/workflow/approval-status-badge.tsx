import { Badge } from '@/components/ui/badge'

const statusConfig = {
  PENDING: { label: '대기', variant: 'secondary' as const },
  REVIEWING: { label: '검토중', variant: 'outline' as const },
  APPROVED: { label: '승인', variant: 'default' as const },
  REJECTED: { label: '반려', variant: 'destructive' as const },
}

export function ApprovalStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: 'outline' as const,
  }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
