import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/get-session'

export default async function StandardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSession()

  const term = await prisma.standardTerm.findUnique({
    where: { id },
    include: {
      domain: { select: { id: true, domainName: true, dataType: true } },
      creator: { select: { name: true } },
    },
  })

  if (!term) notFound()

  const canEdit = user.roles.includes('ADMIN') || user.roles.includes('STANDARD_MANAGER')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{term.termName}</h2>
        <div className="flex gap-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/standards/${id}/edit`}>수정</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/standards">목록</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>용어 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">용어명</p>
              <p className="font-medium">{term.termName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">영문 용어명</p>
              <p className="font-medium">{term.termEnglishName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">약어</p>
              <p className="font-medium">{term.termAbbreviation ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">상태</p>
              <StatusBadge status={term.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">도메인</p>
              <Link href={`/domains/${term.domain.id}`} className="text-blue-600 hover:underline font-medium">
                {term.domain.domainName}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">버전</p>
              <p className="font-medium">{term.version}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">용어 설명</p>
            <p className="font-medium">{term.termDescription}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">등록자</p>
              <p className="font-medium">{term.creator.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">등록일</p>
              <p className="font-medium">{new Date(term.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
