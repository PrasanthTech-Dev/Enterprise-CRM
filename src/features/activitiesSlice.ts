import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { bootstrap } from '@/app/bootstrap';
import type { Activity } from '@/types';

const activitiesSlice = createSlice({
  name: 'activities',
  initialState: { items: [] as Activity[] },
  reducers: {
    addActivity(state, action: PayloadAction<Activity>) {
      state.items.unshift(action.payload);
    },
    updateActivity(state, action: PayloadAction<{ id: string; changes: Partial<Activity> }>) {
      const a = state.items.find((x) => x.id === action.payload.id);
      if (a) Object.assign(a, action.payload.changes);
    },
    deleteActivity(state, action: PayloadAction<string>) {
      state.items = state.items.filter((a) => a.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(bootstrap.fulfilled, (state, action) => {
      state.items = action.payload.activities;
    });
  },
});

export const { addActivity, updateActivity, deleteActivity } = activitiesSlice.actions;
export default activitiesSlice.reducer;
