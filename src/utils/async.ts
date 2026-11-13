/** Simulates network latency so loading states are exercised against the mock data layer. */
export const delay = (ms = 500) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const KEYS = {
  data: 'enterprise-crm-user:data:v1',
  session: 'enterprise-crm-user:session:v1',
} as const;

export const storage = {
  get<T>(key: keyof typeof KEYS): T | null {
    try {
      const raw = localStorage.getItem(KEYS[key]);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set(key: keyof typeof KEYS, value: unknown) {
    try {
      localStorage.setItem(KEYS[key], JSON.stringify(value));
    } catch {
      /* storage may be unavailable (private mode, quota) – the app still works in memory */
    }
  },
  remove(key: keyof typeof KEYS) {
    try {
      localStorage.removeItem(KEYS[key]);
    } catch {
      /* noop */
    }
  },
};
