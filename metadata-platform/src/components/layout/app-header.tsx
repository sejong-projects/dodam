import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { UserNav } from './user-nav'

interface AppHeaderProps {
  userName: string
  userEmail: string
}

export function AppHeader({ userName, userEmail }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <h1 className="text-sm font-semibold">메타데이터 관리 플랫폼</h1>
      </div>
      <UserNav userName={userName} userEmail={userEmail} />
    </header>
  )
}
