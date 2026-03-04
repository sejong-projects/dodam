import { RoleName } from '@/generated/prisma/client'

export type SessionUser = {
  id: string
  email: string
  name: string
  roles: RoleName[]
}
