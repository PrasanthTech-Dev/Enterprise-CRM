import type { ReactNode } from 'react';

interface Entry {
  name?: string | number;
  value?: string | number;
  color?: string;
  fill?: string;
  dataKey?: string | number;
}

export default function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Entry[];
  label?: ReactNode;
  formatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[140px] rounded-xl border border-line bg-elevated/95 px-3 py-2.5 text-xs shadow-2xl backdrop-blur">
      {label !== undefined && label !== '' && <p className="mb-1.5 font-medium text-white">{label}</p>}
      <ul className="space-y-1">
        {payload.map((p, i) => (
          <li key={`${p.dataKey ?? p.name}-${i}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.fill }} aria-hidden />
              {p.name}
            </span>
            <span className="font-semibold tabular-nums text-white">
              {formatter ? formatter(Number(p.value), String(p.name)) : p.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
