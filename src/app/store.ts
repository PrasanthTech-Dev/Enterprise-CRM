import { configureStore } from '@reduxjs/toolkit';
import auth from '@/features/authSlice';
import leads from '@/features/leadsSlice';
import deals from '@/features/dealsSlice';
import customers from '@/features/customersSlice';
import tasks from '@/features/tasksSlice';
import activities from '@/features/activitiesSlice';
import notifications from '@/features/notificationsSlice';
import ui from '@/features/uiSlice';
import { storage } from '@/utils/async';

export const store = configureStore({
  reducer: { auth, leads, deals, customers, tasks, activities, notifications, ui },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/** Persist CRM data between reloads (debounced) – replaces the real API in this front-end build. */
let timer: ReturnType<typeof setTimeout> | undefined;
store.subscribe(() => {
  const s = store.getState();
  if (s.ui.dataStatus !== 'ready') return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    storage.set('data', {
      users: s.auth.users,
      leads: s.leads.items,
      deals: s.deals.items,
      customers: s.customers.items,
      tasks: s.tasks.items,
      activities: s.activities.items,
      notifications: s.notifications.items,
    });
  }, 300);
});
