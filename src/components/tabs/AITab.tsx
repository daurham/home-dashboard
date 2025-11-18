import { Card } from '@/components/ui/card';

export function AITab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">AI Assistant</h2>
        <p className="text-muted-foreground">
          Interact with your AI home assistant
        </p>
      </div>
      
      <Card className="p-8 text-center bg-card">
        <div className="text-muted-foreground">
          AI chat interface will be implemented here
        </div>
      </Card>
    </div>
  );
}
