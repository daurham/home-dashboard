import { useStore } from '@/lib/store';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { EventModal } from '@/components/EventModal';
import { CalendarTab } from '@/components/tabs/CalendarTab';
import { DevicesTab } from '@/components/tabs/DevicesTab';
import { SecurityTab } from '@/components/tabs/SecurityTab';
import { SettingsTab } from '@/components/tabs/SettingsTab';
import { AITab } from '@/components/tabs/AITab';

export default function Dashboard() {
  const { activeSidebarTab } = useStore();
  
  const renderActiveTab = () => {
    switch (activeSidebarTab) {
      case 'calendar':
        return <CalendarTab />;
      case 'devices':
        return <DevicesTab />;
      case 'security':
        return <SecurityTab />;
      case 'settings':
        return <SettingsTab />;
      case 'ai':
        return <AITab />;
      default:
        return <CalendarTab />;
    }
  };
  
  return (
    <div className="flex min-h-screen w-full bg-dashboard-bg">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto p-6 md:p-8">
          {renderActiveTab()}
        </div>
      </main>
      
      <EventModal />
    </div>
  );
}
