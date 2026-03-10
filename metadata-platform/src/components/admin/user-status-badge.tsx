import { Badge } from '@/components/ui/badge'

const statusConfig = {
  ACTIVE: { label: '활성', dotClass: 'bg-emerald-500', variant: 'outline' as const },
  INACTIVE: { label: '비활성', dotClass: 'bg-gray-400', variant: 'secondary' as const },
}

export function UserStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig]
    ?? { label: status, dotClass: 'bg-gray-400', variant: 'outline' as const }

  return (
    <Badge variant={config.variant} className="gap-1.5 font-normal">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </Badge>
  )
}
