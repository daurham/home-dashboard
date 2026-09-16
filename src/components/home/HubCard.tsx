import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface HubCardProps extends HTMLAttributes<HTMLDivElement> {}

export function HubCard({ className, ...props }: HubCardProps) {
  return <div className={cn('hub-card flex h-full min-h-0 flex-col overflow-hidden', className)} {...props} />;
}
