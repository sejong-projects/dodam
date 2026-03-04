import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { getSession } from '@/lib/auth/get-session'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar userRoles={user.roles} />
        <div className="flex flex-1 flex-col">
          <AppHeader userName={user.name} userEmail={user.email} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
