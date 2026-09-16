import { useEffect, useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { PAID_BY_OPTIONS, QUICK_AMOUNTS_CENTS } from '@/lib/expenses/constants';
import { centsToInput, formatCents, parseAmountToCents } from '@/lib/expenses/money';
import { todayYmd } from '@/lib/expenses/weekRange';
import type { Expense, ExpenseCategory } from '@/services/expenseService';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpenseFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  categories: ExpenseCategory[];
  timeZone: string;
  onSubmit: (values: {
    amountCents: number;
    categoryId: string;
    note?: string;
    paidBy?: string | null;
    occurredOn: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function ExpenseFormSheet({
  open,
  onOpenChange,
  expense,
  categories,
  timeZone,
  onSubmit,
  onDelete,
}: ExpenseFormSheetProps) {
  const isMobile = useIsMobile();
  const activeCategories = useMemo(
    () => categories.filter((category) => !category.archivedAt || category.id === expense?.categoryId),
    [categories, expense?.categoryId],
  );

  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [occurredOn, setOccurredOn] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmountText(expense ? centsToInput(expense.amountCents) : '');
    setCategoryId(expense?.categoryId || '');
    setPaidBy(expense?.paidBy === 'Wife' ? 'Bo' : expense?.paidBy || null);
    setNote(expense?.note || '');
    setOccurredOn(expense?.occurredOn || todayYmd(timeZone));
    setShowMore(Boolean(expense?.note || (expense && expense.occurredOn !== todayYmd(timeZone))));
    setError(null);
  }, [open, expense, timeZone]);

  const amountCents = parseAmountToCents(amountText);
  const canSave = Boolean(amountCents && categoryId && !saving);

  const handleSave = async () => {
    if (!amountCents || !categoryId) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        amountCents,
        categoryId,
        note: note.trim() || undefined,
        paidBy,
        occurredOn,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save expense');
    } finally {
      setSaving(false);
    }
  };

  const body = (
    <div className="space-y-5 px-1">
      <div className="space-y-2">
        <Label htmlFor="expense-amount" className="text-muted-foreground">
          Amount
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">
            $
          </span>
          <Input
            id="expense-amount"
            inputMode="decimal"
            autoFocus
            value={amountText}
            onChange={(event) => setAmountText(event.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            aria-label="Amount in dollars"
            className="h-16 pl-9 text-4xl font-semibold tracking-tight"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_AMOUNTS_CENTS.map((cents) => (
            <button
              key={cents}
              type="button"
              onClick={() => setAmountText(centsToInput(cents))}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors',
                'hover:border-foreground/30 hover:text-foreground',
                amountCents === cents && 'border-foreground/40 bg-muted text-foreground',
              )}
            >
              {formatCents(cents)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          {activeCategories.map((category) => {
            const selected = categoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                  selected
                    ? 'border-foreground/30 bg-muted text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                  aria-hidden
                />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground">Who paid (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {PAID_BY_OPTIONS.map((option) => {
            const selected = paidBy === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPaidBy(selected ? null : option.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  selected
                    ? 'border-foreground/30 bg-muted text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowMore((value) => !value)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        More
      </button>

      {showMore && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-note">Note</Label>
            <Textarea
              id="expense-note"
              value={note}
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What was it?"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-date">Date</Label>
            <Input
              id="expense-date"
              type="date"
              value={occurredOn}
              onChange={(event) => setOccurredOn(event.target.value)}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );

  const footer = (
    <div className="flex w-full items-center justify-between gap-2">
      {expense && onDelete ? (
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground"
          onClick={async () => {
            setSaving(true);
            try {
              await onDelete();
              onOpenChange(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not delete');
              setSaving(false);
            }
          }}
        >
          Delete
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={!canSave}>
          {saving ? 'Saving…' : expense ? 'Save' : 'Add expense'}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[var(--vvh,100dvh)]">
          <DrawerHeader>
            <DrawerTitle>{expense ? 'Edit expense' : 'Add expense'}</DrawerTitle>
            <DrawerDescription>
              {expense ? 'Fix amount, category, date, or who paid.' : 'Amount and category are enough.'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 [-webkit-overflow-scrolling:touch]">{body}</div>
          <DrawerFooter className="shrink-0">{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{expense ? 'Edit expense' : 'Add expense'}</SheetTitle>
          <SheetDescription>
            {expense ? 'Fix amount, category, date, or who paid.' : 'Amount and category are enough.'}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 [-webkit-overflow-scrolling:touch]">{body}</div>
        <SheetFooter className="shrink-0">{footer}</SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
