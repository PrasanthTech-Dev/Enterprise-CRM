import { passwordStrength } from '@/hooks/useForm';
import { cn } from '@/utils/format';

const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = ['bg-rose-500', 'bg-rose-500', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-400'];

export default function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const score = passwordStrength(value);
  return (
    <div aria-live="polite">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i < score ? COLORS[score] : 'bg-line')} />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Strength: <span className="font-medium text-slate-200">{LABELS[score]}</span>
      </p>
    </div>
  );
}
