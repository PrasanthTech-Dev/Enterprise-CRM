import type { ReactNode } from 'react';
import { cn } from '@/utils/format';

export default function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        actions ? 'mb-4 md:mb-6' : 'hidden md:flex mb-6',
      )}
    >
      <div className="min-w-0 hidden md:block">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
