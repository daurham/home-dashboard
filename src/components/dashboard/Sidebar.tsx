import { MoreHorizontal } from 'lucide-react';
import { useUIStore, useDashboardStore, usePreferencesStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getVisibleTabs } from '@/lib/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { TabDefinition } from '@/lib/tabs/registry';

function initials(label: string): string {
  return label
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function NavButton({
  tab,
  active,
  onClick,
}: {
  tab: TabDefinition;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-medium transition-colors',
        active
          ? 'bg-white/10 text-white'
          : 'text-rail-muted hover:bg-white/5 hover:text-white',
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="leading-tight">{tab.name}</span>
    </button>
  );
}

export function Sidebar() {
  const { activeSidebarTab, sidebarCollapsed, setActiveSidebarTab, setSidebarCollapsed } = useUIStore();
  const { config } = useDashboardStore();
  const { householdLabel, greetingName } = usePreferencesStore();
  const visibleTabs = getVisibleTabs(config.visibleTabs);
  const isMobile = useIsMobile();

  const primary = visibleTabs.filter((tab) => tab.pin === 'primary');
  const overflow = visibleTabs.filter((tab) => tab.pin === 'overflow');
  const footer = visibleTabs.filter((tab) => tab.pin === 'footer');
  const overflowActive = overflow.some((tab) => tab.id === activeSidebarTab);

  const go = (id: typeof activeSidebarTab) => {
    setActiveSidebarTab(id);
    if (isMobile) setSidebarCollapsed(true);
  };

  const nav = (
    <div className="flex h-full flex-col">
      <nav className="flex flex-1 flex-col gap-1 p-2 pt-4">
        {primary.map((tab) => (
          <NavButton
            key={tab.id}
            tab={tab}
            active={activeSidebarTab === tab.id}
            onClick={() => go(tab.id)}
          />
        ))}
        {overflow.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex w-full flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-medium transition-colors',
                  overflowActive ? 'bg-white/10 text-white' : 'text-rail-muted hover:bg-white/5 hover:text-white',
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span>More</span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="end" className="w-48 p-2">
              {overflow.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => go(tab.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted',
                      activeSidebarTab === tab.id && 'bg-muted font-medium',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
        )}
      </nav>

      <div className="mt-auto space-y-2 p-2 pb-4">
        <div className="flex flex-col items-center gap-1 px-1 py-2 text-center">
          <Avatar className="h-11 w-11 border-2 border-white/20">
            <AvatarFallback className="bg-white/15 text-xs font-semibold text-white">
              {initials(householdLabel || greetingName)}
            </AvatarFallback>
          </Avatar>
          <p className="line-clamp-2 text-[10px] leading-tight text-rail-muted">
            {householdLabel}
          </p>
        </div>
        {footer.map((tab) => (
          <NavButton
            key={tab.id}
            tab={tab}
            active={activeSidebarTab === tab.id}
            onClick={() => go(tab.id)}
          />
        ))}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={!sidebarCollapsed} onOpenChange={(open) => setSidebarCollapsed(!open)}>
        <SheetContent side="left" className="w-[88px] border-r-0 bg-rail p-0 text-rail-foreground [&>button]:hidden">
          {nav}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-[88px] shrink-0 overflow-y-auto bg-rail text-rail-foreground md:flex md:flex-col">
      {nav}
    </aside>
  );
}
