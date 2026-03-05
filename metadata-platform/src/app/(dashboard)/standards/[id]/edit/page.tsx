import { notFound } from 'next/navigation'

import { TermForm } from '@/components/standard/term-form'
import { prisma } from '@/lib/db/prisma'

export default async function EditStandardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const term = await prisma.standardTerm.findUnique({ where: { id } })

  if (!term) notFound()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">표준 용어 수정</h2>
      <TermForm
        termId={id}
        defaultValues={{
          termName: term.termName,
          termEnglishName: term.termEnglishName,
          termDescription: term.termDescription,
          termAbbreviation: term.termAbbreviation,
          domainId: term.domainId,
        }}
      />
    </div>
  )
}
