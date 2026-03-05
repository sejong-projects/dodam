import { z } from 'zod'

export const codeItemSchema = z.object({
  itemCode: z.string().min(1, '코드값을 입력하세요'),
  itemName: z.string().min(1, '코드명을 입력하세요'),
  itemDescription: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
})

export const codeGroupBaseSchema = z.object({
  groupName: z.string().min(1, '코드 그룹명을 입력하세요'),
  groupEnglishName: z.string().min(1, '코드 그룹 영문명을 입력하세요'),
  groupDescription: z.string().min(1, '코드 그룹 설명을 입력하세요'),
  items: z.array(codeItemSchema),
})

export const codeGroupCreateSchema = codeGroupBaseSchema.refine(
  (data) => {
    const codes = data.items.map((item) => item.itemCode)
    return new Set(codes).size === codes.length
  },
  { message: '코드 항목 내 코드값이 중복됩니다', path: ['items'] },
)

export const codeGroupUpdateSchema = codeGroupBaseSchema.refine(
  (data) => {
    const codes = data.items.map((item) => item.itemCode)
    return new Set(codes).size === codes.length
  },
  { message: '코드 항목 내 코드값이 중복됩니다', path: ['items'] },
)

export type CodeItemInput = z.infer<typeof codeItemSchema>
export type CodeGroupCreateInput = z.infer<typeof codeGroupBaseSchema>
export type CodeGroupUpdateInput = z.infer<typeof codeGroupBaseSchema>
