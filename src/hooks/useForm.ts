import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react';

export type Validator<T> = (values: T) => Partial<Record<keyof T, string>>;

/**
 * Minimal typed form helper: controlled values, validation on blur/submit, async submit with loading state.
 */
export function useForm<T extends object>(initial: T, validate: Validator<T>) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setValue = useCallback(
    <K extends keyof T>(name: K, value: T[K]) => {
      setValues((prev) => {
        const next = { ...prev, [name]: value };
        setErrors((e) => {
          if (!touched[name] && !e[name]) return e;
          const fresh = validate(next);
          return { ...e, [name]: fresh[name] };
        });
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [touched],
  );

  const bind = useCallback(
    <K extends keyof T>(name: K) => ({
      name: String(name),
      value: values[name] as never,
      error: errors[name],
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target;
        const v = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
        setValue(name, v as T[K]);
      },
      onBlur: () => {
        setTouched((t) => ({ ...t, [name]: true }));
        setErrors((prev) => ({ ...prev, [name]: validate(values)[name] }));
      },
    }),
    [values, errors, setValue, validate],
  );

  const handleSubmit = useCallback(
    (onValid: (values: T) => void | Promise<void>) => async (e?: FormEvent) => {
      e?.preventDefault();
      const found = validate(values);
      const hasErrors = Object.values(found).some(Boolean);
      setErrors(found);
      setTouched(Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
      setSubmitError(null);
      if (hasErrors) return;
      setSubmitting(true);
      try {
        await onValid(values);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [validate, values],
  );

  const reset = useCallback(
    (next?: T) => {
      setValues(next ?? initial);
      setErrors({});
      setTouched({});
      setSubmitError(null);
    },
    [initial],
  );

  return { values, errors, bind, setValue, handleSubmit, submitting, submitError, setSubmitError, reset };
}

export const validators = {
  required: (v: string, label: string) => (!v?.toString().trim() ? `${label} is required` : undefined),
  email: (v: string) =>
    !v.trim() ? 'Email is required' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? undefined : 'Enter a valid email address',
  phone: (v: string) => (!v.trim() || /^[+()\d\s-]{7,20}$/.test(v.trim()) ? undefined : 'Enter a valid phone number'),
  minLength: (v: string, n: number, label: string) => (v.trim().length < n ? `${label} must be at least ${n} characters` : undefined),
  positiveNumber: (v: string | number, label: string) => {
    const n = Number(v);
    if (v === '' || Number.isNaN(n)) return `${label} must be a number`;
    return n < 0 ? `${label} cannot be negative` : undefined;
  },
  password: (v: string) => {
    if (!v) return 'Password is required';
    if (v.length < 8) return 'Use at least 8 characters';
    if (!/[A-Z]/.test(v)) return 'Include an uppercase letter';
    if (!/[a-z]/.test(v)) return 'Include a lowercase letter';
    if (!/\d/.test(v)) return 'Include a number';
    return undefined;
  },
};

export const passwordStrength = (v: string) => {
  let score = 0;
  if (v.length >= 8) score += 1;
  if (v.length >= 12) score += 1;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score += 1;
  if (/\d/.test(v)) score += 1;
  if (/[^A-Za-z0-9]/.test(v)) score += 1;
  return Math.min(score, 4);
};
