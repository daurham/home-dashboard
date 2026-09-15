import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CATEGORY_COLOR_PRESETS } from '@/lib/expenses/constants';
import { cn } from '@/lib/utils';
import type { ExpenseCategory } from '@/services/expenseService';

interface CategoryManagerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExpenseCategory[];
  onCreate: (name: string, color: string) => Promise<void>;
  onUpdate: (id: string, updates: { name?: string; color?: string; archived?: boolean }) => Promise<void>;
}

export function CategoryManagerSheet({
  open,
  onOpenChange,
  categories,
  onCreate,
  onUpdate,
}: CategoryManagerSheetProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLOR_PRESETS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(() => categories.filter((category) => !category.archivedAt), [categories]);
  const archived = useMemo(() => categories.filter((category) => category.archivedAt), [categories]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate(trimmed, color);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Categories</SheetTitle>
          <SheetDescription>
            Archive hides a category from the picker. Past expenses keep their color in charts.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto py-4">
          <div className="space-y-3">
            <Label htmlFor="new-category">Add category</Label>
            <Input
              id="new-category"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              maxLength={40}
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className={cn(
                    'h-8 w-8 rounded-full border-2',
                    color === preset ? 'border-foreground' : 'border-transparent',
                  )}
                  style={{ backgroundColor: preset }}
                  aria-label={`Color ${preset}`}
                />
              ))}
            </div>
            <Button type="button" onClick={handleCreate} disabled={!name.trim() || saving}>
              Add
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            {active.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onRename={(nextName) => onUpdate(category.id, { name: nextName })}
                onColor={(nextColor) => onUpdate(category.id, { color: nextColor })}
                onArchive={() => onUpdate(category.id, { archived: true })}
              />
            ))}
          </div>

          {archived.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Archived</p>
              {archived.map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdate(category.id, { archived: false })}
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CategoryRow({
  category,
  onRename,
  onColor,
  onArchive,
}: {
  category: ExpenseCategory;
  onRename: (name: string) => Promise<void>;
  onColor: (color: string) => Promise<void>;
  onArchive: () => Promise<void>;
}) {
  const [name, setName] = useState(category.name);

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => {
            const trimmed = name.trim();
            if (trimmed && trimmed !== category.name) {
              void onRename(trimmed);
            } else {
              setName(category.name);
            }
          }}
          className="h-8"
        />
        <Button type="button" variant="ghost" size="sm" onClick={() => void onArchive()}>
          Archive
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_COLOR_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => void onColor(preset)}
            className={cn(
              'h-5 w-5 rounded-full border',
              category.color.toUpperCase() === preset.toUpperCase() ? 'border-foreground' : 'border-transparent',
            )}
            style={{ backgroundColor: preset }}
            aria-label={`Set ${category.name} to ${preset}`}
          />
        ))}
      </div>
    </div>
  );
}
