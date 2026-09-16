import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
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
import {
  clampHabitWeekPageEnd,
  formatHabitWeekRange,
  formatHabitWeeksInterval,
  getHabitWeekDays,
  HABIT_WEEK_PAGE_SIZE,
  habitExistsInWeek,
  habitProgress,
  habitsForWeek,
  isHabitTrackableOn,
  isSameHabitWeek,
  listHabitWeeks,
  shiftHabitWeekPage,
  useHabitStore,
} from '@/lib/store/habitStore';
import { formatDate, isToday, shiftDate, getWeekStart } from '@/lib/calendar';
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
  const [anchor, setAnchor] = useState(() => new Date());
  const [pageEnd, setPageEnd] = useState(() => new Date());
  const weekDays = getHabitWeekDays(anchor, firstDayOfWeek);
  const today = new Date();
  const currentWeek = isSameHabitWeek(anchor, today, firstDayOfWeek);
  const latestPage = isSameHabitWeek(pageEnd, today, firstDayOfWeek);
  const weekHabits = habitsForWeek(habits, weekDays);
  const recentWeeks = listHabitWeeks(pageEnd, HABIT_WEEK_PAGE_SIZE, firstDayOfWeek);
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

  const goPrevWeek = () => setAnchor(shiftDate(getWeekStart(anchor, firstDayOfWeek), -7));
  const goNextWeek = () => {
    if (currentWeek) return;
    setAnchor(shiftDate(getWeekStart(anchor, firstDayOfWeek), 7));
  };
  const goPrevPage = () => {
    const nextEnd = shiftHabitWeekPage(pageEnd, -1, firstDayOfWeek);
    setPageEnd(nextEnd);
    setAnchor(nextEnd);
  };
  const goNextPage = () => {
    if (latestPage) return;
    const nextEnd = clampHabitWeekPageEnd(shiftHabitWeekPage(pageEnd, 1, firstDayOfWeek), today, firstDayOfWeek);
    setPageEnd(nextEnd);
    setAnchor(nextEnd);
  };
  const goLatestPage = () => {
    setPageEnd(today);
    setAnchor(today);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Joint Habit Tracker</h2>
          <p className="text-muted-foreground">
            {currentWeek ? 'Tap a day to mark it complete for this week.' : `Reviewing ${formatHabitWeekRange(weekDays)}. Habits appear starting the week they were added.`}
          </p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" />
          Add habit
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={goPrevWeek} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={goNextWeek} disabled={currentWeek} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="px-1 text-sm font-medium">
            {formatHabitWeekRange(weekDays)}
            {currentWeek ? <span className="ml-2 text-xs font-normal text-muted-foreground">This week</span> : null}
          </p>
        </div>
        {!currentWeek && (
          <Button type="button" variant="ghost" size="sm" onClick={goLatestPage}>
            Back to this week
          </Button>
        )}
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
            {weekHabits.map((habit) => {
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
                    const trackable = isHabitTrackableOn(habit, day);
                    return (
                      <td key={formatDate(day)} className="text-center">
                        {trackable ? (
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
                        ) : (
                          <span className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground/40" aria-hidden>
                            —
                          </span>
                        )}
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
            {habits.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No habits yet. Add one to start tracking this week.</p>
            ) : weekHabits.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No habits existed this week.</p>
            ) : null}
          </>
        )}
      </HubCard>

      {hasLoaded && habits.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Past weeks</h3>
              <p className="text-xs text-muted-foreground">
                Four weeks at a time. A dash means the habit had not been added yet; 0/n means it existed and was skipped.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={goPrevPage} aria-label="Previous 4 weeks">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="min-w-[11rem] text-center text-sm font-medium">
                {formatHabitWeeksInterval(recentWeeks)}
              </p>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={goNextPage} disabled={latestPage} aria-label="Next 4 weeks">
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!latestPage && (
                <Button type="button" variant="ghost" size="sm" onClick={goLatestPage}>
                  Latest
                </Button>
              )}
            </div>
          </div>
          <HubCard className="overflow-x-auto p-4">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 text-left font-medium">Habit</th>
                  {recentWeeks.map((week) => {
                    const selected = isSameHabitWeek(week[0], anchor, firstDayOfWeek);
                    const isCurrent = isSameHabitWeek(week[0], today, firstDayOfWeek);
                    return (
                      <th key={formatDate(week[0])} className="pb-2 text-center font-medium">
                        <button
                          type="button"
                          onClick={() => setAnchor(week[0])}
                          className={cn(
                            'rounded-md px-1.5 py-1 hover:bg-muted',
                            selected && 'bg-muted text-foreground',
                          )}
                        >
                          <div>{formatHabitWeekRange(week)}</div>
                          <div className="font-normal normal-case tracking-normal">{isCurrent ? 'Now' : ''}</div>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => (
                  <tr key={habit.id}>
                    <td className="py-1 pr-3 font-medium">{habit.name}</td>
                    {recentWeeks.map((week) => {
                      const existed = habitExistsInWeek(habit, week);
                      const progress = habitProgress(habit, week);
                      const selected = isSameHabitWeek(week[0], anchor, firstDayOfWeek);
                      return (
                        <td key={formatDate(week[0])} className="text-center">
                          <button
                            type="button"
                            onClick={() => setAnchor(week[0])}
                            className={cn(
                              'inline-flex min-w-[3.25rem] items-center justify-center rounded-md px-1.5 py-1 tabular-nums text-muted-foreground hover:bg-muted',
                              selected && 'bg-muted text-foreground',
                              existed && progress.total > 0 && progress.done === progress.total && 'text-emerald-600 dark:text-emerald-400',
                            )}
                          >
                            {existed ? `${progress.done}/${progress.total}` : '—'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </HubCard>
        </div>
      )}

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
