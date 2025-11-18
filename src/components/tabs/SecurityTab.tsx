import { Card } from '@/components/ui/card';

export function SecurityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Security</h2>
        <p className="text-muted-foreground">
          Monitor security cameras and access controls
        </p>
      </div>
      
      <Card className="p-8 text-center bg-card">
        <div className="text-muted-foreground">
          Security monitoring will be implemented here
        </div>
      </Card>
    </div>
  );
}
