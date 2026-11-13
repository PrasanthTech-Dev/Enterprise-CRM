import { createAsyncThunk } from '@reduxjs/toolkit';
import { buildSeed } from '@/data/seed';
import { delay, storage } from '@/utils/async';

export type SeedData = ReturnType<typeof buildSeed>;

/** Loads CRM data (persisted copy first, otherwise the demo seed) – stands in for the REST API. */
export const bootstrap = createAsyncThunk<SeedData>('app/bootstrap', async () => {
  await delay(900);
  const saved = storage.get<SeedData>('data');
  const freshNotifications = buildSeed().notifications;
  if (saved && saved.leads && saved.users) {
    if (saved.notifications) {
      saved.notifications = saved.notifications.map((n) => ({
        ...n,
        title: n.title.replace(/Nexus/gi, 'Enterprise'),
        message: n.message.replace(/Nexus/gi, 'Enterprise'),
      }));
    }
    const existingIds = new Set((saved.notifications || []).map((n) => n.id));
    const missing = freshNotifications.filter((n) => !existingIds.has(n.id));
    if (missing.length > 0) {
      saved.notifications = [...missing, ...(saved.notifications || [])];
    }
    storage.set('data', saved);
    return saved;
  }
  const initial = buildSeed();
  storage.set('data', initial);
  return initial;
});
