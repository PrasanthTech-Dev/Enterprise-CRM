import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { bootstrap, type SeedData } from '@/app/bootstrap';
import type { AppNotification } from '@/types';
import { storage } from '@/utils/async';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { items: [] as AppNotification[] },
  reducers: {
    addNotification(state, action: PayloadAction<AppNotification>) {
      state.items.unshift(action.payload);
      const saved = storage.get<SeedData>('data');
      if (saved) {
        saved.notifications = state.items;
        storage.set('data', saved);
      }
    },
    markRead(state, action: PayloadAction<string>) {
      const n = state.items.find((x) => x.id === action.payload);
      if (n) {
        n.read = true;
        const saved = storage.get<SeedData>('data');
        if (saved) {
          saved.notifications = state.items;
          storage.set('data', saved);
        }
      }
    },
    markUnread(state, action: PayloadAction<string>) {
      const n = state.items.find((x) => x.id === action.payload);
      if (n) {
        n.read = false;
        const saved = storage.get<SeedData>('data');
        if (saved) {
          saved.notifications = state.items;
          storage.set('data', saved);
        }
      }
    },
    markAllRead(state, action: PayloadAction<string>) {
      state.items.forEach((n) => {
        if (n.userId === action.payload || n.userId === 'all' || !n.userId) n.read = true;
      });
      const saved = storage.get<SeedData>('data');
      if (saved) {
        saved.notifications = state.items;
        storage.set('data', saved);
      }
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.items = state.items.filter((n) => n.id !== action.payload);
      const saved = storage.get<SeedData>('data');
      if (saved) {
        saved.notifications = state.items;
        storage.set('data', saved);
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(bootstrap.fulfilled, (state, action) => {
      state.items = action.payload.notifications.map((n) => ({
        ...n,
        title: n.title.replace(/Nexus/gi, 'Enterprise'),
        message: n.message.replace(/Nexus/gi, 'Enterprise'),
      }));
    });
  },
});

export const { addNotification, markRead, markUnread, markAllRead, removeNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
