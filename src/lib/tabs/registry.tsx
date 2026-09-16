import {
  Activity,
  Calendar,
  Cpu,
  FolderUp,
  Home,
  Leaf,
  NotebookPen,
  Settings,
  Shield,
  Sparkles,
  Target,
  Video,
  Wallet,
  Users,
  LucideIcon,
} from 'lucide-react';
import { SidebarTab } from '@/lib/store';
import {
  CalendarTab,
  PlantsTab,
  DevicesTab,
  CamerasTab,
  SecurityTab,
  SettingsTab,
  AITab,
  ExpensesTab,
  LatencySparklinesTab,
  HomeTab,
  ChoresTab,
  HabitsTab,
  FilesTab,
  LogsTab,
} from '@/components/tabs';

export interface TabDefinition {
  id: SidebarTab;
  name: string;
  component: React.ComponentType;
  icon: LucideIcon;
  default?: boolean;
  order?: number;
  /** Primary items shown in the mockup rail. Others go under More. */
  pin?: 'primary' | 'overflow' | 'footer';
}

/**
 * Tab registry - centralized definition of all available tabs
 *
 * This makes the tab system plug-and-play and future-proof.
 * New tabs can be added here without modifying Sidebar or Dashboard components.
 */
export const TABS: TabDefinition[] = [
  {
    id: 'home',
    name: 'Home',
    component: HomeTab,
    icon: Home,
    default: true,
    order: 1,
    pin: 'primary',
  },
  {
    id: 'expenses',
    name: 'Expenses',
    component: ExpensesTab,
    icon: Wallet,
    order: 2,
    pin: 'primary',
  },
  {
    id: 'chores',
    name: 'Chores',
    component: ChoresTab,
    icon: Users,
    order: 3,
    pin: 'primary',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    component: CalendarTab,
    icon: Calendar,
    order: 4,
    pin: 'primary',
  },
  {
    id: 'habits',
    name: 'Habits',
    component: HabitsTab,
    icon: Target,
    order: 5,
    pin: 'primary',
  },
  {
    id: 'cameras',
    name: 'Cameras',
    component: CamerasTab,
    icon: Video,
    order: 6,
    pin: 'primary',
  },
  {
    id: 'files',
    name: 'Files',
    component: FilesTab,
    icon: FolderUp,
    order: 7,
    pin: 'primary',
  },
  {
    id: 'logs',
    name: 'Logs',
    component: LogsTab,
    icon: NotebookPen,
    order: 8,
    pin: 'overflow',
  },
  {
    id: 'latency',
    name: 'Latency',
    component: LatencySparklinesTab,
    icon: Activity,
    order: 9,
    pin: 'overflow',
  },
  {
    id: 'plants',
    name: 'Plants',
    component: PlantsTab,
    icon: Leaf,
    order: 10,
    pin: 'overflow',
  },
  {
    id: 'devices',
    name: 'Devices',
    component: DevicesTab,
    icon: Cpu,
    order: 11,
    pin: 'overflow',
  },
  {
    id: 'security',
    name: 'Security',
    component: SecurityTab,
    icon: Shield,
    order: 12,
    pin: 'overflow',
  },
  {
    id: 'ai',
    name: 'AI',
    component: AITab,
    icon: Sparkles,
    order: 13,
    pin: 'overflow',
  },
  {
    id: 'settings',
    name: 'Settings',
    component: SettingsTab,
    icon: Settings,
    order: 14,
    pin: 'footer',
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
