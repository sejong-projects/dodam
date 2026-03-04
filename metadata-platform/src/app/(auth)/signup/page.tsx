'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth/client'
import { assignDefaultRole } from '@/lib/auth/actions'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(undefined)

    const formData = new FormData(e.currentTarget)
    const { data, error } = await authClient.signUp.email({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
    })

    if (error) {
      setError(error.message || '회원가입에 실패했습니다')
      setIsPending(false)
      return
    }

    if (data?.user?.id) {
      await assignDefaultRole(data.user.id)
    }

    router.push('/standards')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>새 계정을 만들어 시작하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" placeholder="홍길동" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" name="email" type="email" placeholder="email@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" name="password" type="password" placeholder="8자 이상" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">소속 부서 (선택)</Label>
            <Input id="department" name="department" placeholder="정보기술부" />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '가입 중...' : '회원가입'}
          </Button>
          <p className="text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
