import { Menu, X, MoreVertical } from 'lucide-react';
import { useUIStore, useModuleStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getModuleById } from '@/lib/modules/registry';
import { ModuleSlot } from '@/components/modules/ModuleSlot';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function RightSidebar() {
  const { rightSidebarCollapsed, setRightSidebarCollapsed } = useUIStore();
  const { modules, removeModule } = useModuleStore();

  const renderModule = (moduleType: string | null, slotIndex: 0 | 1) => {
    if (!moduleType) {
      return <ModuleSlot slotIndex={slotIndex} />;
    }

    const moduleDef = getModuleById(moduleType);
    if (!moduleDef) {
      return <ModuleSlot slotIndex={slotIndex} />;
    }

    const ModuleComponent = moduleDef.component;
    const slotId = `module-slot-${slotIndex}`;

    return (
      <div className="h-full flex flex-col relative">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm font-medium text-sidebar-foreground">{moduleDef.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => removeModule(slotIndex)}
                className="text-destructive focus:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Remove Module
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex-1 overflow-hidden">
          <ModuleComponent slotId={slotId} />
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <aside
        className={cn(
          'bg-sidebar border-l border-sidebar-border transition-all duration-300 flex flex-col',
          'sticky top-0 h-screen overflow-hidden',
          rightSidebarCollapsed ? 'w-0 border-0' : 'w-80'
        )}
      >
        {!rightSidebarCollapsed && (
          <>
            <div className="p-4 flex items-center justify-between border-b border-sidebar-border flex-shrink-0">
              <h2 className="text-lg font-semibold text-sidebar-foreground">Modules</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRightSidebarCollapsed(true)}
                className="text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* First Module Slot */}
              <div className="h-[calc(50vh-4rem)] min-h-[280px]">
                {renderModule(modules[0], 0)}
              </div>

              {/* Second Module Slot */}
              <div className="h-[calc(50vh-4rem)] min-h-[280px]">
                {renderModule(modules[1], 1)}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Collapsed Toggle Button */}
      {rightSidebarCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRightSidebarCollapsed(false)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 rounded-l-md rounded-r-none border border-r-0 border-sidebar-border bg-sidebar hover:bg-sidebar-accent shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

