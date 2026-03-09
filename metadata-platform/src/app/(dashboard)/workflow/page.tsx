import { getSession } from '@/lib/auth/get-session'
import { WorkflowListClient } from '@/components/workflow/workflow-list-client'

export default async function WorkflowPage() {
  const user = await getSession()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">승인 관리</h2>
      <WorkflowListClient userRoles={user.roles} />
    </div>
  )
}
