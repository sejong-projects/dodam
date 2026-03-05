import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/get-session'

export default async function DomainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSession()

  const domain = await prisma.standardDomain.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      terms: { select: { id: true, termName: true, status: true } },
    },
  })

  if (!domain) notFound()

  const canEdit = user.roles.includes('ADMIN') || user.roles.includes('STANDARD_MANAGER')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{domain.domainName}</h2>
        <div className="flex gap-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/domains/${id}/edit`}>수정</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/domains">목록</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>도메인 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">도메인명</p>
              <p className="font-medium">{domain.domainName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">상태</p>
              <StatusBadge status={domain.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">데이터 타입</p>
              <p className="font-medium">{domain.dataType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">길이</p>
              <p className="font-medium">{domain.length ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">소수점 자리수</p>
              <p className="font-medium">{domain.scale ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">허용 값</p>
              <p className="font-medium">{domain.allowedValues || '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">설명</p>
            <p className="font-medium">{domain.domainDescription}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <p className="text-sm text-muted-foreground">등록자</p>
              <p className="font-medium">{domain.creator.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">등록일</p>
              <p className="font-medium">{new Date(domain.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {domain.terms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>연결된 표준 용어 ({domain.terms.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {domain.terms.map((term) => (
                <li key={term.id} className="flex items-center justify-between">
                  <Link href={`/standards/${term.id}`} className="text-blue-600 hover:underline">
                    {term.termName}
                  </Link>
                  <StatusBadge status={term.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
