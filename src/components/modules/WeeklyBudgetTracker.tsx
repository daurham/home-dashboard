import { useState, useMemo } from 'react';
import { useBudgetStore } from '@/lib/store/budgetStore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Plus, Edit2, Trash2, DollarSign, TrendingDown, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface WeeklyBudgetTrackerProps {
  slotId: string;
}

export function WeeklyBudgetTracker({ slotId }: WeeklyBudgetTrackerProps) {
  const {
    getBudgetData,
    setWeeklyBudget,
    addPurchase,
    updatePurchase,
    removePurchase,
    clearAllPurchases,
    getRemainingBudget,
    getTotalSpent,
  } = useBudgetStore();

  const budgetData = getBudgetData(slotId);
  const weeklyBudget = budgetData.weeklyBudget;
  const purchases = budgetData.purchases;

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<string | null>(null);
  const [formData, setFormData] = useState({ description: '', amount: '' });

  const remainingBudget = getRemainingBudget(slotId);
  const totalSpent = getTotalSpent(slotId);
  const isNegative = remainingBudget < 0;

  // Prepare chart data - show budget over time
  const chartData = useMemo(() => {
    const sortedPurchases = [...purchases].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const data: Array<{ date: string; budget: number; spent: number }> = [
      { date: 'Start', budget: weeklyBudget, spent: 0 },
    ];

    let cumulativeSpent = 0;
    sortedPurchases.forEach((purchase) => {
      cumulativeSpent += purchase.amount;
      data.push({
        date: format(new Date(purchase.date), 'MMM dd'),
        budget: weeklyBudget,
        spent: cumulativeSpent,
      });
    });

    return data;
  }, [purchases, weeklyBudget]);

  const handleAddPurchase = () => {
    if (formData.description && formData.amount) {
      addPurchase(slotId, {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: new Date().toISOString(),
      });
      setFormData({ description: '', amount: '' });
      setIsAddDialogOpen(false);
    }
  };

  const handleEditPurchase = () => {
    if (editingPurchase && formData.description && formData.amount) {
      updatePurchase(slotId, editingPurchase, {
        description: formData.description,
        amount: parseFloat(formData.amount),
      });
      setFormData({ description: '', amount: '' });
      setEditingPurchase(null);
    }
  };

  const startEdit = (purchaseId: string) => {
    const purchase = purchases.find((p) => p.id === purchaseId);
    if (purchase) {
      setFormData({
        description: purchase.description,
        amount: purchase.amount.toString(),
      });
      setEditingPurchase(purchaseId);
    }
  };

  const chartConfig = {
    budget: {
      label: 'Budget',
      color: 'hsl(var(--chart-1))',
    },
    spent: {
      label: 'Spent',
      color: isNegative ? 'hsl(var(--destructive))' : 'hsl(var(--chart-2))',
    },
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-end gap-2">
          {purchases.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Purchases?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all purchases and reset your tracker. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => clearAllPurchases(slotId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        {/* Budget Summary */}
        <div className="space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Starting Budget</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={weeklyBudget}
                onChange={(e) => setWeeklyBudget(slotId, parseFloat(e.target.value) || 0)}
                className="w-24 h-8 text-right"
                min="0"
                step="0.01"
              />
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Spent</span>
            <span className="text-sm font-medium">${totalSpent.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-semibold">Remaining</span>
            <span
              className={cn(
                'text-lg font-bold',
                isNegative ? 'text-destructive' : 'text-green-600 dark:text-green-400'
              )}
            >
              ${remainingBudget.toFixed(2)}
            </span>
          </div>
          {isNegative && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <TrendingDown className="h-4 w-4" />
              <span>Over budget by ${Math.abs(remainingBudget).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-[180px] flex items-center justify-center flex-shrink-0">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          {payload.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                              <span className="text-sm text-muted-foreground">
                                {entry.name === 'budget' ? 'Budget' : 'Spent'}
                              </span>
                              <span className="font-medium">
                                ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="budget"
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="spent"
                stroke={isNegative ? 'hsl(var(--destructive))' : 'hsl(var(--chart-2))'}
                fill={isNegative ? 'hsl(var(--destructive))' : 'hsl(var(--chart-2))'}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Purchases List */}
        <div className="space-y-2 flex-1 min-h-0 overflow-hidden flex flex-col">
          <Label className="text-sm font-semibold flex-shrink-0">Recent Purchases</Label>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 flex-shrink-0">
              No purchases yet. Add one to get started!
            </p>
          ) : (
            <div className="space-y-1 overflow-y-auto flex-1 min-h-0">
              {[...purchases]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{purchase.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(purchase.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">${purchase.amount.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => startEdit(purchase.id)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removePurchase(slotId, purchase.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Add Purchase Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What did you buy?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPurchase} disabled={!formData.description || !formData.amount}>
              Add Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Purchase Dialog */}
      <Dialog open={editingPurchase !== null} onOpenChange={(open) => !open && setEditingPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What did you buy?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPurchase(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditPurchase} disabled={!formData.description || !formData.amount}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

