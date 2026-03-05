import { z } from 'zod'

export const termCreateSchema = z.object({
  termName: z.string().min(1, '용어명을 입력하세요'),
  termEnglishName: z.string().min(1, '영문 용어명을 입력하세요'),
  termDescription: z.string().min(1, '용어 설명을 입력하세요'),
  termAbbreviation: z.string().optional().nullable(),
  domainId: z.string().uuid('도메인을 선택하세요'),
})

export const termUpdateSchema = termCreateSchema.partial()

export type TermCreateInput = z.infer<typeof termCreateSchema>
export type TermUpdateInput = z.infer<typeof termUpdateSchema>
