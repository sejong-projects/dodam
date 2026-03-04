import { z } from 'zod'

export const domainCreateSchema = z.object({
  domainName: z.string().min(1, '도메인명을 입력하세요'),
  domainDescription: z.string().min(1, '도메인 설명을 입력하세요'),
  dataType: z.string().min(1, '데이터 타입을 선택하세요'),
  length: z.number().int().positive().optional().nullable(),
  scale: z.number().int().min(0).optional().nullable(),
  allowedValues: z.string().optional().nullable(),
})

export const domainUpdateSchema = domainCreateSchema.partial()

export type DomainCreateInput = z.infer<typeof domainCreateSchema>
export type DomainUpdateInput = z.infer<typeof domainUpdateSchema>
