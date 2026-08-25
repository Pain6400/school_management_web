import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full flex flex-col">
        <header className="border-b p-4 flex items-center">
          <SidebarTrigger />
          <h1 className="ml-4 font-semibold text-lg">Dashboard</h1>
        </header>
        <div className="p-4 flex-1 bg-muted/20">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
