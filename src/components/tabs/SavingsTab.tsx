import { useState } from 'react';
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HubCard } from '@/components/home/HubCard';
import { SavingsProgressRing } from '@/components/savings/SavingsProgressRing';
import { centsToInput, formatBudget, parseAmountToCents } from '@/lib/expenses/money';
import {
  draftFromAccount,
  emptySavingsDraft,
  remainingToGoalCents,
  SAVINGS_KIND_COLORS,
  SAVINGS_KINDS,
  savingsKindLabel,
  savingsProgressPercent,
  savingsTotalCents,
  type SavingsAccount,
  type SavingsAccountDraft,
  type SavingsKind,
} from '@/lib/savings/model';
import { useSavingsStore } from '@/lib/store/savingsStore';

export function SavingsTab() {
  const accounts = useSavingsStore((s) => s.accounts);
  const goalCents = useSavingsStore((s) => s.goalCents);
  const setGoalCents = useSavingsStore((s) => s.setGoalCents);
  const addAccount = useSavingsStore((s) => s.addAccount);
  const updateAccount = useSavingsStore((s) => s.updateAccount);
  const removeAccount = useSavingsStore((s) => s.removeAccount);

  const [goalOpen, setGoalOpen] = useState(false);
  const [goalText, setGoalText] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsAccount | null>(null);
  const [draft, setDraft] = useState<SavingsAccountDraft>(emptySavingsDraft());
  const [amountText, setAmountText] = useState('');

  const totalCents = savingsTotalCents(accounts);
  const remaining = remainingToGoalCents(totalCents, goalCents);
  const percent = savingsProgressPercent(totalCents, goalCents);
  const ranked = [...accounts].sort((a, b) => b.amountCents - a.amountCents);
  const slices = ranked.map((account) => ({
    id: account.id,
    name: account.name,
    color: SAVINGS_KIND_COLORS[account.kind],
    cents: account.amountCents,
  }));

  const startGoal = () => {
    setGoalText(goalCents > 0 ? centsToInput(goalCents) : '');
    setGoalOpen(true);
  };

  const saveGoal = () => {
    const cents = parseAmountToCents(goalText, { allowZero: true });
    if (cents == null) return;
    setGoalCents(cents);
    setGoalOpen(false);
  };

  const startCreate = () => {
    setEditing(null);
    setDraft(emptySavingsDraft());
    setAmountText('');
    setAccountOpen(true);
  };

  const startEdit = (account: SavingsAccount) => {
    setEditing(account);
    setDraft(draftFromAccount(account));
    setAmountText((account.amountCents / 100).toFixed(2));
    setAccountOpen(true);
  };

  const saveAccount = () => {
    const cents = parseAmountToCents(amountText, { allowZero: true });
    if (!draft.name.trim() || !draft.location.trim() || cents == null) return;
    const next = { ...draft, amountCents: cents };
    if (editing) updateAccount(editing.id, next);
    else addAccount(next);
    setAccountOpen(false);
  };

  const canSaveAccount = Boolean(
    draft.name.trim()
    && draft.location.trim()
    && parseAmountToCents(amountText, { allowZero: true }) != null,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Savings</h2>
          <p className="text-muted-foreground">
            Track each pile of savings and where it lives. Totals stay here until Google Sheets sync is connected.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" onClick={startGoal}>
            {goalCents > 0 ? 'Edit goal' : 'Set goal'}
          </Button>
          <Button type="button" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Add account
          </Button>
        </div>
      </div>

      <HubCard className="p-5">
        <div className="grid gap-6 md:grid-cols-[minmax(10rem,16rem)_minmax(0,1fr)]">
          <div className="mx-auto h-48 w-48 md:h-full md:w-full md:max-h-56">
            <SavingsProgressRing
              slices={slices}
              totalCents={totalCents}
              goalCents={goalCents}
            />
          </div>
          <div className="flex flex-col justify-center gap-3">
            <div>
              <p className="text-3xl font-semibold tabular-nums tracking-tight">{formatBudget(totalCents)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {goalCents > 0 ? `of ${formatBudget(goalCents)} goal` : 'No goal set yet'}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {goalCents > 0 && (
                <p>
                  <span className="font-medium tabular-nums">{Math.round(percent)}%</span>
                  <span className="ml-1 text-muted-foreground">of goal</span>
                </p>
              )}
              {goalCents > 0 && (
                <p className={remaining < 0 ? 'text-emerald-600' : undefined}>
                  <span className="font-medium tabular-nums">
                    {remaining < 0 ? formatBudget(-remaining) : formatBudget(remaining)}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    {remaining < 0 ? 'over goal' : 'to go'}
                  </span>
                </p>
              )}
              <p>
                <span className="font-medium tabular-nums">{accounts.length}</span>
                <span className="ml-1 text-muted-foreground">
                  {accounts.length === 1 ? 'place' : 'places'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </HubCard>

      <HubCard className="p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Where it is stored</h3>
        </div>
        {ranked.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
            <p className="text-sm font-medium">Nothing logged yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add cash, bank accounts, or other holdings so the total stays honest.
            </p>
            <Button type="button" size="sm" className="mt-3" onClick={startCreate}>
              <Plus className="h-4 w-4" />
              Add account
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {ranked.map((account) => (
              <li key={account.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className="h-9 w-9 shrink-0 rounded-full"
                  style={{ backgroundColor: `${SAVINGS_KIND_COLORS[account.kind]}22` }}
                >
                  <span
                    className="flex h-full w-full items-center justify-center text-xs font-semibold"
                    style={{ color: SAVINGS_KIND_COLORS[account.kind] }}
                  >
                    {account.name.slice(0, 1).toUpperCase()}
                  </span>
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => startEdit(account)}
                >
                  <span className="block truncate font-medium leading-tight">{account.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {account.location} · {savingsKindLabel(account.kind)}
                    {account.notes ? ` · ${account.notes}` : ''}
                  </span>
                </button>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatBudget(account.amountCents)}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`${account.name} actions`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEdit(account)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => removeAccount(account.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </HubCard>

      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Savings goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="savings-goal">Goal amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="savings-goal"
                inputMode="decimal"
                value={goalText}
                onChange={(event) => setGoalText(event.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">Set 0 to track totals without a target.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGoalOpen(false)}>Cancel</Button>
            <Button onClick={saveGoal} disabled={parseAmountToCents(goalText, { allowZero: true }) == null}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit account' : 'Add account'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="savings-name">Name</Label>
              <Input
                id="savings-name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Emergency fund"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="savings-location">Where it is stored</Label>
              <Input
                id="savings-location"
                value={draft.location}
                onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                placeholder="Ally Bank, cash box, Vanguard…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={draft.kind}
                  onValueChange={(value) => setDraft({ ...draft, kind: value as SavingsKind })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SAVINGS_KINDS.map((kind) => (
                      <SelectItem key={kind.id} value={kind.id}>{kind.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="savings-amount">Amount</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="savings-amount"
                    inputMode="decimal"
                    value={amountText}
                    onChange={(event) => setAmountText(event.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="savings-notes">Notes</Label>
              <Textarea
                id="savings-notes"
                value={draft.notes}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                placeholder="Optional"
                className="min-h-[72px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAccountOpen(false)}>Cancel</Button>
            <Button onClick={saveAccount} disabled={!canSaveAccount}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
