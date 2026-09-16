import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HubCard } from '@/components/home/HubCard';
import { CHORE_ICON_COLORS, CHORE_ICON_OPTIONS, CHORE_ICONS, WEEKDAY_LABELS } from '@/components/home/choreIcons';
import {
  formatChoreInterval,
  getChoreStatus,
  useChoreStore,
  type Chore,
  type ChoreDraft,
  type ChoreIconId,
  type ChoreIntervalUnit,
} from '@/lib/store/choreStore';
import { formatDate } from '@/lib/calendar';
import { usePreferencesStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const INTERVAL_PRESETS: Array<{ label: string; every: number; unit: ChoreIntervalUnit }> = [
  { label: 'Every 3 days', every: 3, unit: 'days' },
  { label: 'Weekly', every: 1, unit: 'weeks' },
  { label: 'Every 2 weeks', every: 2, unit: 'weeks' },
  { label: 'Monthly', every: 1, unit: 'months' },
  { label: 'Every 2 months', every: 2, unit: 'months' },
  { label: 'Every 6 months', every: 6, unit: 'months' },
];

const emptyDraft = (assignee: string): ChoreDraft => ({
  title: '',
  assignee,
  every: 3,
  unit: 'days',
  weekday: new Date().getDay(),
  monthDay: Math.min(28, new Date().getDate()),
  icon: 'generic',
  daySpecific: false,
});

export function ChoresTab() {
  const chores = useChoreStore((s) => s.chores);
  const addChore = useChoreStore((s) => s.addChore);
  const updateChore = useChoreStore((s) => s.updateChore);
  const removeChore = useChoreStore((s) => s.removeChore);
  const toggleComplete = useChoreStore((s) => s.toggleComplete);
  const members = usePreferencesStore((s) => s.householdMembers);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Chore | null>(null);
  const [draft, setDraft] = useState<ChoreDraft>(emptyDraft(members[0] || 'Jake'));

  const today = formatDate(new Date());
  const ranked = useMemo(
    () => [...chores].map((chore) => ({ chore, status: getChoreStatus(chore) })),
    [chores],
  );

  const startCreate = () => {
    setEditing(null);
    setDraft(emptyDraft(members[0] || 'Jake'));
    setOpen(true);
  };

  const startEdit = (chore: Chore) => {
    setEditing(chore);
    setDraft({
      title: chore.title,
      assignee: chore.assignee,
      every: chore.every,
      unit: chore.unit,
      weekday: chore.weekday,
      monthDay: chore.monthDay,
      icon: chore.icon,
      daySpecific: chore.daySpecific,
    });
    setOpen(true);
  };

  const save = () => {
    if (!draft.title.trim()) return;
    if (editing) updateChore(editing.id, draft);
    else addChore(draft);
    setOpen(false);
  };

  const matchesPreset = (every: number, unit: ChoreIntervalUnit) =>
    draft.every === every && draft.unit === unit;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Recurring Chores</h2>
          <p className="text-muted-foreground">Household tasks on whatever cadence they actually use.</p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" />
          Add chore
        </Button>
      </div>

      <div className="grid gap-3">
        {ranked.map(({ chore, status }) => {
          const Icon = CHORE_ICONS[chore.icon];
          return (
            <HubCard key={chore.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className={cn('flex h-11 w-11 items-center justify-center rounded-full', CHORE_ICON_COLORS[chore.icon])}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{chore.title}</p>
                <p className="text-sm text-muted-foreground">
                  {chore.assignee} · {formatChoreInterval(chore)}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{status.label}</span>
              <Button variant="outline" size="sm" onClick={() => toggleComplete(chore.id)}>
                {chore.lastCompletedOn === today ? 'Undo' : 'Mark done'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => startEdit(chore)}>Edit</Button>
              <Button variant="ghost" size="icon" onClick={() => removeChore(chore.id)} aria-label="Delete chore">
                <Trash2 className="h-4 w-4" />
              </Button>
            </HubCard>
          );
        })}
        {chores.length === 0 && (
          <HubCard className="p-8 text-center text-muted-foreground">
            No recurring chores yet. Add the first one to see it on Home.
          </HubCard>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit chore' : 'Add chore'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chore-title">Title</Label>
              <Input id="chore-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={draft.assignee} onValueChange={(value) => setDraft({ ...draft, assignee: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member} value={member}>{member}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Repeats</Label>
              <div className="flex flex-wrap gap-1.5">
                {INTERVAL_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDraft({ ...draft, every: preset.every, unit: preset.unit })}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs',
                      matchesPreset(preset.every, preset.unit)
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-[5.5rem_1fr] gap-3">
              <div className="space-y-2">
                <Label htmlFor="chore-every">Every</Label>
                <Input
                  id="chore-every"
                  type="number"
                  min={1}
                  max={365}
                  value={draft.every}
                  onChange={(e) => setDraft({ ...draft, every: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Interval</Label>
                <Select value={draft.unit} onValueChange={(value) => setDraft({ ...draft, unit: value as ChoreIntervalUnit })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
              <div className="space-y-1">
                <Label htmlFor="chore-day-specific">Day specific</Label>
                <p className="text-xs text-muted-foreground">
                  {draft.daySpecific
                    ? 'Keeps the same slot every time. Finishing early clears just that occurrence.'
                    : `Due today, then ${formatChoreInterval({ ...draft, daySpecific: false }).toLowerCase()} from the day you finish it. Rolls over until done.`}
                </p>
              </div>
              <Switch
                id="chore-day-specific"
                checked={draft.daySpecific}
                onCheckedChange={(checked) => setDraft({ ...draft, daySpecific: checked })}
              />
            </div>
            {draft.daySpecific && draft.unit === 'weeks' && (
              <div className="space-y-2">
                <Label>Due on</Label>
                <Select value={String(draft.weekday)} onValueChange={(value) => setDraft({ ...draft, weekday: Number(value) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_LABELS.map((label, index) => (
                      <SelectItem key={label} value={String(index)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {draft.daySpecific && draft.unit === 'months' && (
              <div className="space-y-2">
                <Label htmlFor="chore-month-day">Day of month</Label>
                <Input
                  id="chore-month-day"
                  type="number"
                  min={1}
                  max={28}
                  value={draft.monthDay}
                  onChange={(e) => setDraft({ ...draft, monthDay: Number(e.target.value) })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {CHORE_ICON_OPTIONS.map((option) => {
                  const Icon = CHORE_ICONS[option.id];
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, icon: option.id as ChoreIconId })}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border',
                        CHORE_ICON_COLORS[option.id],
                        draft.icon === option.id && 'ring-2 ring-foreground',
                      )}
                      aria-label={option.label}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!draft.title.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
