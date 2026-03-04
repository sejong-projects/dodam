'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth/client'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(undefined)

    const formData = new FormData(e.currentTarget)
    const { error } = await authClient.signIn.email({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다')
      setIsPending(false)
    } else {
      router.push('/standards')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>로그인</CardTitle>
        <CardDescription>메타데이터 관리 플랫폼에 로그인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" name="email" type="email" placeholder="email@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '로그인 중...' : '로그인'}
          </Button>
          <p className="text-center text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
