import { Check } from 'lucide-react';
import { HubCard } from '@/components/home/HubCard';
import { getHabitWeekDays, habitProgress, useHabitStore } from '@/lib/store/habitStore';
import { formatDate, isToday } from '@/lib/calendar';
import { useDashboardStore, useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { HabitFetchSkeleton } from '@/components/ui/fetch-skeleton';

export function HabitTrackerCard({ compact = false }: { compact?: boolean }) {
  const habits = useHabitStore((s) => s.habits);
  const hasLoaded = useHabitStore((s) => s.hasLoaded);
  const toggleDay = useHabitStore((s) => s.toggleDay);
  const setActiveSidebarTab = useUIStore((s) => s.setActiveSidebarTab);
  const firstDayOfWeek = useDashboardStore((s) => s.config.calendar.firstDayOfWeek);
  const weekDays = getHabitWeekDays(new Date(), firstDayOfWeek);
  const dayLetters = firstDayOfWeek === 0
    ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const visible = habits.slice(0, compact ? 5 : 8);
  const circle = compact ? 'h-5 w-5' : 'h-7 w-7';
  const check = compact ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <HubCard className={compact ? 'p-2' : 'p-3'}>
      <div className={cn('flex items-center justify-between gap-2', compact ? 'mb-1' : 'mb-2')}>
        <h2 className={cn('font-semibold', compact ? 'text-[11px]' : 'text-sm')}>
          {compact ? 'Habits' : 'Habit Tracker'}
        </h2>
        <button
          type="button"
          className={cn('text-muted-foreground hover:text-foreground', compact ? 'text-[10px]' : 'text-xs')}
          onClick={() => setActiveSidebarTab('habits')}
        >
          All
        </button>
      </div>

      {!hasLoaded ? (
        <HabitFetchSkeleton rows={compact ? 3 : 4} compact={compact} />
      ) : (
      <div
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{
          gridTemplateColumns: `38% repeat(7,minmax(0,1fr)) auto`,
          gridTemplateRows: `auto repeat(${Math.max(visible.length, 1)}, minmax(0,1fr))`,
        }}
      >
        <div />
        {weekDays.map((day, index) => (
          <div
            key={formatDate(day)}
            className={cn(
              'flex items-end justify-center pb-1 font-medium uppercase tracking-wide text-muted-foreground',
              compact ? 'text-[8px]' : 'text-[10px]',
              isToday(day) && 'text-foreground',
            )}
          >
            {dayLetters[index]}
          </div>
        ))}
        <div className={cn('flex items-end justify-end pb-1 font-medium text-muted-foreground', compact ? 'text-[8px]' : 'text-[10px]')}>
          #
        </div>

        {visible.length === 0 && (
          <p className="col-span-9 self-center text-xs text-muted-foreground">No habits yet.</p>
        )}

        {visible.map((habit) => {
          const progress = habitProgress(habit, weekDays);
          return (
            <div key={habit.id} className="contents">
              <div className="flex min-w-0 items-center pr-3">
                <span
                  className={cn('truncate font-medium leading-tight', compact ? 'text-[10px]' : 'text-xs')}
                  title={habit.name}
                >
                  {habit.name}
                </span>
              </div>
              {weekDays.map((day) => {
                const complete = Boolean(habit.completions[formatDate(day)]);
                return (
                  <div key={formatDate(day)} className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => toggleDay(habit.id, day)}
                      className={cn(
                        'inline-flex items-center justify-center rounded-full border transition-colors',
                        circle,
                        complete
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-border bg-background text-transparent hover:border-emerald-400',
                        isToday(day) && !complete && 'border-emerald-400',
                      )}
                      aria-label={`${habit.name} ${day.toLocaleDateString('en-US', { weekday: 'long' })}`}
                    >
                      <Check className={check} />
                    </button>
                  </div>
                );
              })}
              <div className={cn('flex items-center justify-end tabular-nums text-muted-foreground', compact ? 'text-[9px]' : 'text-[11px]')}>
                {progress.done}/{progress.total}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </HubCard>
  );
}
