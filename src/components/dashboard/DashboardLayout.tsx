import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { EventModal } from './Modals/EventModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUIStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const { sidebarCollapsed, setSidebarCollapsed, rightSidebarCollapsed, setRightSidebarCollapsed } = useUIStore();

  return (
    <div className="flex min-h-screen w-full bg-dashboard-bg flex-col md:flex-row">
      {/* Mobile Header with Left Sidebar Toggle */}
      {isMobile && (
        <header className="sticky top-0 z-40 w-full border-b border-sidebar-border bg-sidebar md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-sidebar-foreground">Dashboard</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>
      )}

      {/* Left Sidebar - Always render, but hidden on mobile (shown via Sheet) */}
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
      
      {/* Right Sidebar - Always render, but hidden on mobile (shown via Sheet) */}
      <RightSidebar />
      
      <EventModal />
    </div>
  );
}

