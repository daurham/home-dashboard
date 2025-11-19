import { Card } from '@/components/ui/card';

export function PlantsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Plants</h2>
        <p className="text-muted-foreground">
          Control and monitor your plants health
        </p>
      </div>
      
      <Card className="p-8 text-center bg-card">
        <div className="text-muted-foreground">
          Plant sensor data will be monitored here
        </div>
      </Card>
    </div>
  );
}
