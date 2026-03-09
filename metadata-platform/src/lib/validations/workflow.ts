import { z } from 'zod'

export const approveSchema = z.object({
  comment: z.string().optional(),
})

export const rejectSchema = z.object({
  comment: z.string().min(1, '반려 사유를 입력하세요'),
})

export type ApproveInput = z.infer<typeof approveSchema>
export type RejectInput = z.infer<typeof rejectSchema>
