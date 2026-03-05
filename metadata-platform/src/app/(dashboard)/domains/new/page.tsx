import { DomainForm } from '@/components/domain/domain-form'

export default function NewDomainPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">표준 도메인 등록</h2>
      <DomainForm />
    </div>
  )
}
