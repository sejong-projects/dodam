import { Badge } from '@/components/ui/badge'

const statusConfig = {
  DRAFT: { label: '초안', variant: 'secondary' as const },
  ACTIVE: { label: '활성', variant: 'default' as const },
  DEPRECATED: { label: '폐기', variant: 'destructive' as const },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
