'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CodeItemEditor } from '@/components/code/code-item-editor'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import { codeGroupBaseSchema, type CodeGroupCreateInput } from '@/lib/validations/code'

interface CodeGroupFormProps {
  defaultValues?: Partial<CodeGroupCreateInput>
  groupId?: string
}

export function CodeGroupForm({ defaultValues, groupId }: CodeGroupFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>()
  const isEditing = !!groupId

  const form = useForm<CodeGroupCreateInput>({
    resolver: zodResolver(codeGroupBaseSchema),
    defaultValues: {
      groupName: '',
      groupEnglishName: '',
      groupDescription: '',
      items: [],
      ...defaultValues,
    },
  })

  const items = form.watch('items')

  async function onSubmit(data: CodeGroupCreateInput) {
    try {
      if (isEditing) {
        await apiClient(`/api/codes/${groupId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
      } else {
        await apiClient('/api/codes', {
          method: 'POST',
          body: JSON.stringify(data),
        })
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.codes.all })
      router.push('/codes')
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
        <div className="space-y-6 max-w-2xl">
          <FormField
            control={form.control}
            name="groupName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>코드 그룹명 *</FormLabel>
                <FormControl>
                  <Input placeholder="예: 성별코드" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="groupEnglishName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>코드 그룹 영문명 *</FormLabel>
                <FormControl>
                  <Input placeholder="예: GENDER_CODE" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="groupDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>코드 그룹 설명 *</FormLabel>
                <FormControl>
                  <Textarea placeholder="코드 그룹에 대한 설명을 입력하세요" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-6">
          <CodeItemEditor
            value={items}
            onChange={(newItems) => form.setValue('items', newItems, { shouldValidate: true })}
          />
          {form.formState.errors.items && (
            <p className="text-sm text-destructive mt-2">
              {typeof form.formState.errors.items.message === 'string'
                ? form.formState.errors.items.message
                : '코드 항목을 확인해주세요'}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? '저장 중...' : isEditing ? '수정' : '등록'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
        </div>
      </form>
    </Form>
  )
}
