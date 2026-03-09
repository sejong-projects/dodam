import { notFound, redirect } from 'next/navigation'

import { CodeGroupForm } from '@/components/code/code-group-form'
import { prisma } from '@/lib/db/prisma'
import { getSession, hasAnyRole } from '@/lib/auth/get-session'
import { RoleName } from '@/generated/prisma/client'

export default async function EditCodeGroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSession()

  if (!hasAnyRole(user, [RoleName.ADMIN, RoleName.STANDARD_MANAGER])) {
    redirect('/codes')
  }

  const codeGroup = await prisma.codeGroup.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!codeGroup) notFound()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">코드 그룹 수정</h2>
      <CodeGroupForm
        groupId={id}
        defaultValues={{
          groupName: codeGroup.groupName,
          groupEnglishName: codeGroup.groupEnglishName,
          groupDescription: codeGroup.groupDescription,
          items: codeGroup.items.map((item) => ({
            itemCode: item.itemCode,
            itemName: item.itemName,
            itemDescription: item.itemDescription,
            sortOrder: item.sortOrder,
            isActive: item.isActive,
          })),
        }}
      />
    </div>
  )
}
