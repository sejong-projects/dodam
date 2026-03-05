'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import { termCreateSchema, type TermCreateInput } from '@/lib/validations/standard'

interface TermFormProps {
  defaultValues?: Partial<TermCreateInput>
  termId?: string
}

export function TermForm({ defaultValues, termId }: TermFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const isEditing = !!termId

  const { data: domainsData } = useQuery({
    queryKey: queryKeys.domains.list({ size: '100' }),
    queryFn: () => apiClient('/api/domains?size=100'),
  })

  const domains = (domainsData as any)?.data || []

  const form = useForm<TermCreateInput>({
    resolver: zodResolver(termCreateSchema),
    defaultValues: {
      termName: '',
      termEnglishName: '',
      termDescription: '',
      termAbbreviation: null,
      domainId: '',
      ...defaultValues,
    },
  })

  async function onSubmit(data: TermCreateInput) {
    try {
      if (isEditing) {
        await apiClient(`/api/standards/${termId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
      } else {
        await apiClient('/api/standards', {
          method: 'POST',
          body: JSON.stringify(data),
        })
      }
      router.push('/standards')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <FormField
          control={form.control}
          name="termName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>용어명 *</FormLabel>
              <FormControl>
                <Input placeholder="예: 고객명" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="termEnglishName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>영문 용어명 *</FormLabel>
              <FormControl>
                <Input placeholder="예: Customer Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="termDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>용어 설명 *</FormLabel>
              <FormControl>
                <Textarea placeholder="용어에 대한 설명을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="termAbbreviation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>약어</FormLabel>
              <FormControl>
                <Input placeholder="예: CUST_NM" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="domainId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>도메인 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="도메인을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {domains.map((domain: { id: string; domainName: string }) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.domainName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
