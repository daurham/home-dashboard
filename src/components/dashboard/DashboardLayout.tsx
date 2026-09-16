import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { EventModal } from './Modals/EventModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChoreStore, useFileShareStore, useHabitStore, useUIStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTabById } from '@/lib/tabs';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const { sidebarCollapsed, setSidebarCollapsed, activeSidebarTab } = useUIStore();
  const loadChores = useChoreStore((s) => s.load);
  const loadHabits = useHabitStore((s) => s.load);
  const loadFiles = useFileShareStore((s) => s.load);
  const isHome = activeSidebarTab === 'home';

  useEffect(() => {
    void loadChores();
    void loadHabits();
    void loadFiles();
  }, [loadChores, loadHabits, loadFiles]);

  return (
    <div className={cn(
      'flex w-full bg-dashboard-bg flex-col md:flex-row',
      isHome ? 'h-dvh overflow-hidden' : 'min-h-dvh',
    )}>
      {isMobile && (
        <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-rail pt-[env(safe-area-inset-top)] md:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="touch-manipulation text-white hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-white">
              {getTabById(activeSidebarTab)?.name ?? 'Home'}
            </h2>
          </div>
        </header>
      )}

      <Sidebar />

      <main className={cn(
        'relative z-0 min-h-0 min-w-0 flex-1',
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

      <EventModal />
    </div>
  );
}
