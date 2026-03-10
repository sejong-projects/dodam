import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

const widths = [
  ['w-16', 'w-32', 'w-14', 'w-24', 'w-14', 'w-20', 'w-8'],
  ['w-14', 'w-36', 'w-12', 'w-20', 'w-14', 'w-20', 'w-8'],
  ['w-20', 'w-28', 'w-16', 'w-28', 'w-14', 'w-20', 'w-8'],
  ['w-12', 'w-32', 'w-14', 'w-16', 'w-14', 'w-20', 'w-8'],
  ['w-18', 'w-30', 'w-10', 'w-24', 'w-14', 'w-20', 'w-8'],
]

export function UserTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>부서</TableHead>
          <TableHead>역할</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>가입일</TableHead>
          <TableHead className="w-[80px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {widths.map((row, i) => (
          <TableRow key={i}>
            {row.map((w, j) => (
              <TableCell key={j}>
                <Skeleton className={`h-4 ${w}`} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
