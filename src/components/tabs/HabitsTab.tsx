import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HubCard } from '@/components/home/HubCard';
import { getHabitWeekDays, habitProgress, useHabitStore } from '@/lib/store/habitStore';
import { formatDate, isToday } from '@/lib/calendar';
import { useDashboardStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { HabitFetchSkeleton } from '@/components/ui/fetch-skeleton';

export function HabitsTab() {
  const habits = useHabitStore((s) => s.habits);
  const hasLoaded = useHabitStore((s) => s.hasLoaded);
  const addHabit = useHabitStore((s) => s.addHabit);
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const removeHabit = useHabitStore((s) => s.removeHabit);
  const toggleDay = useHabitStore((s) => s.toggleDay);
  const firstDayOfWeek = useDashboardStore((s) => s.config.calendar.firstDayOfWeek);
  const weekDays = getHabitWeekDays(new Date(), firstDayOfWeek);
  const dayLetters = firstDayOfWeek === 0
    ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');

  const startCreate = () => {
    setEditingId(null);
    setName('');
    setOpen(true);
  };

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setName(current);
    setOpen(true);
  };

  const save = () => {
    if (!name.trim()) return;
    if (editingId) updateHabit(editingId, name);
    else addHabit(name);
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Joint Habit Tracker</h2>
          <p className="text-muted-foreground">Tap a day to mark it complete for this week.</p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" />
          Add habit
        </Button>
      </div>

      <HubCard className="overflow-x-auto p-5">
        {!hasLoaded ? (
          <HabitFetchSkeleton rows={4} />
        ) : (
          <>
            <table className="w-full min-w-[520px] border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-2 text-left font-medium">Habit</th>
              {weekDays.map((day, index) => (
                <th key={formatDate(day)} className={cn('pb-2 text-center font-medium', isToday(day) && 'text-foreground')}>
                  <div>{dayLetters[index]}</div>
                  <div className="font-normal">{day.getDate()}</div>
                </th>
              ))}
              <th className="pb-2 text-right font-medium">Progress</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              const progress = habitProgress(habit, weekDays);
              return (
                <tr key={habit.id}>
                  <td className="py-1 pr-3">
                    <button type="button" className="font-medium hover:underline" onClick={() => startEdit(habit.id, habit.name)}>
                      {habit.name}
                    </button>
                  </td>
                  {weekDays.map((day) => {
                    const complete = Boolean(habit.completions[formatDate(day)]);
                    return (
                      <td key={formatDate(day)} className="text-center">
                        <button
                          type="button"
                          onClick={() => toggleDay(habit.id, day)}
                          className={cn(
                            'inline-flex h-8 w-8 items-center justify-center rounded-full border',
                            complete ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border bg-background text-transparent',
                          )}
                          aria-label={`${habit.name} ${day.toLocaleDateString()}`}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </td>
                    );
                  })}
                  <td className="text-right tabular-nums text-muted-foreground">{progress.done}/{progress.total}</td>
                  <td className="pl-2 text-right">
                    <Button variant="ghost" size="icon" onClick={() => removeHabit(habit.id)} aria-label={`Delete ${habit.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
            </table>
            {habits.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">No habits yet. Add one to start tracking this week.</p>
            )}
          </>
        )}
      </HubCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Rename habit' : 'Add habit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="habit-name">Name</Label>
            <Input id="habit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Drink 2L water" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!name.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
