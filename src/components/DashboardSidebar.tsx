import { Calendar, Home, Shield, Settings, Sparkles, Menu } from 'lucide-react';
import { useStore, SidebarTab } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sidebarItems: Array<{ id: SidebarTab; label: string; icon: typeof Calendar }> = [
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'devices', label: 'Devices', icon: Home },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'ai', label: 'AI', icon: Sparkles },
];

export function DashboardSidebar() {
  const { activeSidebarTab, sidebarCollapsed, setActiveSidebarTab, setSidebarCollapsed } = useStore();
  
  return (
    <aside
      className={cn(
        'bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
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
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSidebarTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveSidebarTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors mb-1',
                'hover:bg-sidebar-accent',
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground',
                !isActive && 'text-sidebar-foreground'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-medium truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
