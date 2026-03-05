import { CodeGroupForm } from '@/components/code/code-group-form'

export default function NewCodeGroupPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">코드 그룹 등록</h2>
      <CodeGroupForm />
    </div>
  )
}
