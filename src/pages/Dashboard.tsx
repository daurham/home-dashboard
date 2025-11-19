import { useUIStore } from '@/lib/store';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { getTabById, getDefaultTab } from '@/lib/tabs';

export default function Dashboard() {
  const { activeSidebarTab } = useUIStore();
  
  const renderActiveTab = () => {
    const tab = getTabById(activeSidebarTab) || getDefaultTab();
    const TabComponent = tab.component;
    return <TabComponent />;
  };
  
  return (
    <DashboardLayout>
      {renderActiveTab()}
    </DashboardLayout>
  );
}
