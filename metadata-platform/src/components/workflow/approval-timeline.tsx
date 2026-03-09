const actionConfig: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: '제출', color: 'bg-blue-500' },
  APPROVED: { label: '승인', color: 'bg-green-500' },
  REJECTED: { label: '반려', color: 'bg-red-500' },
  CANCELLED: { label: '취소', color: 'bg-gray-400' },
}

export interface TimelineEntry {
  id: string
  action: string
  comment: string | null
  actor: { id: string; name: string }
  createdAt: string | Date
}

export function ApprovalTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null

  return (
    <div className="relative space-y-0">
      {entries.map((entry, index) => {
        const config = actionConfig[entry.action] || {
          label: entry.action,
          color: 'bg-gray-400',
        }
        const isLast = index === entries.length - 1

        return (
          <div key={entry.id} className="relative flex gap-4 pb-6">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[7px] top-4 h-full w-[2px] bg-border" />
            )}

            {/* Dot */}
            <div className="relative flex-shrink-0 pt-1">
              <div className={`h-4 w-4 rounded-full ${config.color} ring-4 ring-background`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{config.label}</span>
                <span className="text-sm text-muted-foreground">— {entry.actor.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(entry.createdAt).toLocaleString('ko-KR')}
              </p>
              {entry.comment && (
                <p className="mt-1.5 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  {entry.comment}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
