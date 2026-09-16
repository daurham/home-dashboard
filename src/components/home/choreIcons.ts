import {
  Bath,
  Utensils,
  Droplets,
  PawPrint,
  Shirt,
  Sparkles,
  Star,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import type { ChoreIconId } from '@/lib/store/choreStore';

export const CHORE_ICONS: Record<ChoreIconId, LucideIcon> = {
  bins: Trash2,
  vacuum: Star,
  bath: Sparkles,
  plants: Droplets,
  laundry: Shirt,
  kitchen: Utensils,
  pets: PawPrint,
  generic: Sparkles,
};

export const CHORE_ICON_OPTIONS: Array<{ id: ChoreIconId; label: string }> = [
  { id: 'bins', label: 'Bins' },
  { id: 'vacuum', label: 'Vacuum' },
  { id: 'bath', label: 'Bathroom' },
  { id: 'plants', label: 'Plants' },
  { id: 'laundry', label: 'Laundry' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'pets', label: 'Pets' },
  { id: 'generic', label: 'Other' },
];

export const CHORE_ICON_COLORS: Record<ChoreIconId, string> = {
  bins: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  vacuum: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  bath: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  plants: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  laundry: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  kitchen: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  pets: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  generic: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
