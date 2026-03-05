'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { apiClient } from '@/lib/api/client'
import { domainCreateSchema, type DomainCreateInput } from '@/lib/validations/domain'

const dataTypes = ['VARCHAR', 'NUMBER', 'DATE', 'TIMESTAMP', 'BOOLEAN', 'TEXT', 'INTEGER', 'DECIMAL']

interface DomainFormProps {
  defaultValues?: Partial<DomainCreateInput>
  domainId?: string
}

export function DomainForm({ defaultValues, domainId }: DomainFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const isEditing = !!domainId

  const form = useForm<DomainCreateInput>({
    resolver: zodResolver(domainCreateSchema),
    defaultValues: {
      domainName: '',
      domainDescription: '',
      dataType: '',
      length: null,
      scale: null,
      allowedValues: null,
      ...defaultValues,
    },
  })

  async function onSubmit(data: DomainCreateInput) {
    try {
      if (isEditing) {
        await apiClient(`/api/domains/${domainId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
      } else {
        await apiClient('/api/domains', {
          method: 'POST',
          body: JSON.stringify(data),
        })
      }
      router.push('/domains')
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
          name="domainName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>도메인명 *</FormLabel>
              <FormControl>
                <Input placeholder="예: 한글명" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="domainDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>도메인 설명 *</FormLabel>
              <FormControl>
                <Textarea placeholder="도메인에 대한 설명을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dataType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>데이터 타입 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="데이터 타입을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {dataTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>길이</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="100"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>소수점 자리수</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="allowedValues"
          render={({ field }) => (
            <FormItem>
              <FormLabel>허용 값</FormLabel>
              <FormControl>
                <Input placeholder="정규식 또는 값 목록" {...field} value={field.value ?? ''} />
              </FormControl>
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
