import { Calendar, Home, Shield, Settings, Sparkles, LucideIcon, Leaf, Video, Wallet, Activity } from 'lucide-react';
import { SidebarTab } from '@/lib/store';
import { CalendarTab, PlantsTab, DevicesTab, CamerasTab, SecurityTab, SettingsTab, AITab, ExpensesTab, LatencySparklinesTab } from '@/components/tabs';

export interface TabDefinition {
  id: SidebarTab;
  name: string;
  component: React.ComponentType;
  icon: LucideIcon;
  default?: boolean;
  order?: number;
}

/**
 * Tab registry - centralized definition of all available tabs
 * 
 * This makes the tab system plug-and-play and future-proof.
 * New tabs can be added here without modifying Sidebar or Dashboard components.
 */
export const TABS: TabDefinition[] = [
  {
    id: 'calendar',
    name: 'Calendar',
    component: CalendarTab,
    icon: Calendar,
    default: true,
    order: 1,
  },
  {
    id: 'expenses',
    name: 'Expenses',
    component: ExpensesTab,
    icon: Wallet,
    order: 2,
  },
  {
    id: 'latency',
    name: 'Latency',
    component: LatencySparklinesTab,
    icon: Activity,
    order: 3,
  },
  {
    id: 'plants',
    name: 'Plants',
    component: PlantsTab,
    icon: Leaf,
    order: 4,
  },
  {
    id: 'devices',
    name: 'Devices',
    component: DevicesTab,
    icon: Home,
    order: 5,
  },
  {
    id: 'cameras',
    name: 'Cameras',
    component: CamerasTab,
    icon: Video,
    order: 6,
  },
  {
    id: 'security',
    name: 'Security',
    component: SecurityTab,
    icon: Shield,
    order: 7,
  },
  {
    id: 'ai',
    name: 'AI',
    component: AITab,
    icon: Sparkles,
    order: 8,
  },
  {
    id: 'settings',
    name: 'Settings',
    component: SettingsTab,
    icon: Settings,
    order: 9,
  },
];

/**
 * Get a tab by ID
 */
export function getTabById(id: SidebarTab): TabDefinition | undefined {
  return TABS.find(tab => tab.id === id);
}

/**
 * Get the default tab
 */
export function getDefaultTab(): TabDefinition {
  return TABS.find(tab => tab.default) || TABS[0];
}

/**
 * Get tabs filtered by visibility (based on config)
 */
export function getVisibleTabs(visibleTabIds: SidebarTab[]): TabDefinition[] {
  return TABS
    .filter(tab => visibleTabIds.includes(tab.id))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Get all tab IDs
 */
export function getAllTabIds(): SidebarTab[] {
  return TABS.map(tab => tab.id);
}

