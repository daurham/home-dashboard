import { useState } from 'react';
import { useModuleStore } from '@/lib/store/moduleStore';
import { getAllModules } from '@/lib/modules/registry';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleSlotProps {
  slotIndex: 0 | 1;
}

export function ModuleSlot({ slotIndex }: ModuleSlotProps) {
  const { setModule } = useModuleStore();
  const [isOpen, setIsOpen] = useState(false);
  const availableModules = getAllModules();

  const handleAddModule = (moduleId: string) => {
    setModule(slotIndex, moduleId as any);
    setIsOpen(false);
  };

  return (
    <Card className={cn(
      "h-full flex items-center justify-center border-2 border-dashed",
      "hover:border-primary/50 transition-colors cursor-pointer",
      "bg-muted/30"
    )}>
      <CardContent className="flex flex-col items-center justify-center gap-3 p-6">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Empty Module Slot</p>
          <p className="text-xs text-muted-foreground">Add a module to customize your dashboard</p>
        </div>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Module
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            {availableModules.map((module) => {
              const Icon = module.icon;
              return (
                <DropdownMenuItem
                  key={module.id}
                  onClick={() => handleAddModule(module.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{module.name}</span>
                    <span className="text-xs text-muted-foreground">{module.description}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}

