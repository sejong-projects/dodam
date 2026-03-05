import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/status-badge'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/get-session'

export default async function CodeGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSession()

  const codeGroup = await prisma.codeGroup.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      items: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!codeGroup) notFound()

  const canEdit = user.roles.includes('ADMIN') || user.roles.includes('STANDARD_MANAGER')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{codeGroup.groupName}</h2>
        <div className="flex gap-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/codes/${id}/edit`}>수정</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/codes">목록</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>코드 그룹 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">코드 그룹명</p>
              <p className="font-medium">{codeGroup.groupName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">상태</p>
              <StatusBadge status={codeGroup.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">영문명</p>
              <p className="font-medium">{codeGroup.groupEnglishName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">코드 항목 수</p>
              <p className="font-medium">{codeGroup.items.length}개</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">설명</p>
            <p className="font-medium">{codeGroup.groupDescription}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">등록자</p>
              <p className="font-medium">{codeGroup.creator.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">등록일</p>
              <p className="font-medium">{new Date(codeGroup.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>코드 항목 ({codeGroup.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {codeGroup.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              등록된 코드 항목이 없습니다
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>코드값</TableHead>
                  <TableHead>코드명</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead className="w-20">활성 여부</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codeGroup.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.itemCode}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.itemDescription || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
