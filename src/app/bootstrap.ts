import { createAsyncThunk } from '@reduxjs/toolkit';
import { buildSeed } from '@/data/seed';
import { delay, storage } from '@/utils/async';

export type SeedData = ReturnType<typeof buildSeed>;

/** Loads CRM data (persisted copy first, otherwise the demo seed) – stands in for the REST API. */
export const bootstrap = createAsyncThunk<SeedData, { forceReset?: boolean } | undefined>(
  'app/bootstrap',
  async (options) => {
    await delay(options?.forceReset ? 300 : 900);
    const saved = options?.forceReset ? null : storage.get<SeedData>('data');
    const freshSeed = buildSeed();
    const freshNotifications = freshSeed.notifications;

    const hasValidData =
      saved &&
      Array.isArray(saved.leads) &&
      saved.leads.length > 0 &&
      Array.isArray(saved.customers) &&
      saved.customers.length > 0 &&
      Array.isArray(saved.deals) &&
      saved.deals.length > 0 &&
      Array.isArray(saved.tasks) &&
      saved.tasks.length > 0 &&
      Array.isArray(saved.users) &&
      saved.users.length > 0;

    if (hasValidData) {
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

    // Corrupted, empty, or forced reset: populate fresh seed data while preserving active users
    const initial = freshSeed;
    if (saved && Array.isArray(saved.users) && saved.users.length > 0) {
      const userMap = new Map(initial.users.map((u) => [u.id, u]));
      for (const u of saved.users) {
        userMap.set(u.id, u);
      }
      initial.users = Array.from(userMap.values());
    }

    storage.set('data', initial);
    return initial;
  },
);
