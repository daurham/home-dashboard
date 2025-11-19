import { Sidebar } from './Sidebar';
import { EventModal } from './Modals/EventModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-dashboard-bg">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto p-6 md:p-8">
          {children}
        </div>
      </main>
      
      <EventModal />
    </div>
  );
}

