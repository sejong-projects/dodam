import { notFound } from 'next/navigation'

import { DomainForm } from '@/components/domain/domain-form'
import { prisma } from '@/lib/db/prisma'

export default async function EditDomainPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const domain = await prisma.standardDomain.findUnique({ where: { id } })

  if (!domain) notFound()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">표준 도메인 수정</h2>
      <DomainForm
        domainId={id}
        defaultValues={{
          domainName: domain.domainName,
          domainDescription: domain.domainDescription,
          dataType: domain.dataType,
          length: domain.length,
          scale: domain.scale,
          allowedValues: domain.allowedValues,
        }}
      />
    </div>
  )
}
