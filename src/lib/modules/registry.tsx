import { ReactNode } from 'react';
import { ModuleType } from '@/lib/store/moduleStore';
import { Wallet, List } from 'lucide-react';
import { WeeklyBudgetTracker } from '@/components/modules/WeeklyBudgetTracker';
import { ListMaker } from '@/components/modules/ListMaker';

export interface ModuleDefinition {
  id: ModuleType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<{ slotId: string }>;
}

export const moduleRegistry: Record<NonNullable<ModuleType>, ModuleDefinition> = {
  'weekly-budget-tracker': {
    id: 'weekly-budget-tracker',
    name: 'Weekly Budget Tracker',
    description: 'Track your weekly spending with a visual budget tracker',
    icon: Wallet,
    component: WeeklyBudgetTracker,
  },
  'list-maker': {
    id: 'list-maker',
    name: 'List Maker',
    description: 'Create and manage lists with checkboxes or bullet points',
    icon: List,
    component: ListMaker,
  },
};

export function getModuleById(id: ModuleType): ModuleDefinition | undefined {
  if (!id) return undefined;
  return moduleRegistry[id];
}

export function getAllModules(): ModuleDefinition[] {
  return Object.values(moduleRegistry);
}

