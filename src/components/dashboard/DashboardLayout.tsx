import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { EventModal } from './Modals/EventModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUIStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTabById } from '@/lib/tabs';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const HUB_TABS = new Set(['home', 'expenses', 'chores', 'habits', 'latency']);

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const { sidebarCollapsed, setSidebarCollapsed, rightSidebarCollapsed, setRightSidebarCollapsed, activeSidebarTab } = useUIStore();
  const hideRightSidebar = HUB_TABS.has(activeSidebarTab);
  const isHome = activeSidebarTab === 'home';

  return (
    <div className={cn(
      'flex w-full bg-dashboard-bg flex-col md:flex-row',
      isHome ? 'h-screen overflow-hidden' : 'min-h-screen',
    )}>
      {isMobile && (
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-rail md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-white">
              {getTabById(activeSidebarTab)?.name ?? 'Home'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
              className="text-white hover:bg-white/10"
              disabled={hideRightSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>
      )}

      <Sidebar />

      <main className={cn(
        'flex-1 min-h-0 min-w-0',
        isHome && !isMobile ? 'overflow-hidden' : 'overflow-y-auto',
      )}>
        <div
          className={cn(
            'mx-auto w-full',
            isHome
              ? cn('flex min-h-0 max-w-[1600px] flex-col p-3 md:p-4', isMobile ? 'min-h-full' : 'h-full')
              : 'container max-w-7xl p-4 md:p-6 lg:p-8',
          )}
        >
          {children}
        </div>
      </main>

      {!hideRightSidebar && <RightSidebar />}

      <EventModal />
    </div>
  );
}
