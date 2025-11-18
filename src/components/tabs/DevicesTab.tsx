import { Card } from '@/components/ui/card';

export function DevicesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Devices</h2>
        <p className="text-muted-foreground">
          Control and monitor your smart home devices
        </p>
      </div>
      
      <Card className="p-8 text-center bg-card">
        <div className="text-muted-foreground">
          Device controls will be implemented here
        </div>
      </Card>
    </div>
  );
}
