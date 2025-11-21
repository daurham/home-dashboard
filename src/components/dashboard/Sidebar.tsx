import { Menu, X } from 'lucide-react';
import { useUIStore, useDashboardStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getVisibleTabs } from '@/lib/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export function Sidebar() {
  const { activeSidebarTab, sidebarCollapsed, setActiveSidebarTab, setSidebarCollapsed } = useUIStore();
  const { config } = useDashboardStore();
  const visibleTabs = getVisibleTabs(config.visibleTabs);
  const isMobile = useIsMobile();

  // Mobile: Show as Sheet from top
  if (isMobile) {
    return (
      <Sheet open={!sidebarCollapsed} onOpenChange={(open) => setSidebarCollapsed(!open)}>
        <SheetContent side="top" className="h-auto max-h-[80vh] overflow-y-auto bg-sidebar text-sidebar-foreground p-0 [&>button]:hidden">
          <div className="flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
              <h2 className="text-lg font-semibold text-sidebar-foreground">Dashboard</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(true)}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-2">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSidebarTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveSidebarTab(tab.id);
                      setSidebarCollapsed(true);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors mb-1',
                      'hover:bg-sidebar-accent',
                      isActive && 'bg-sidebar-primary text-sidebar-primary-foreground',
                      !isActive && 'text-sidebar-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium truncate">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Show as regular sidebar
  return (
    <aside
      className={cn(
        'hidden md:flex bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-col',
        'sticky top-0 h-screen overflow-y-auto',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <h2 className="text-lg font-semibold text-sidebar-foreground">Dashboard</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      <nav className="flex-1 p-2">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSidebarTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSidebarTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors mb-1',
                'hover:bg-sidebar-accent',
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground',
                !isActive && 'text-sidebar-foreground'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium truncate">{tab.name}</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

