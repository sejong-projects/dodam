import { z } from 'zod'

import { RoleName } from '@/generated/prisma/client'

export const roleUpdateSchema = z.object({
  roles: z.array(z.nativeEnum(RoleName)).min(1, '최소 1개의 역할을 선택하세요'),
})

export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>
