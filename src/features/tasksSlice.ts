import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { bootstrap } from '@/app/bootstrap';
import type { Task, TaskStatus } from '@/types';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { items: [] as Task[] },
  reducers: {
    addTask(state, action: PayloadAction<Task>) {
      state.items.unshift(action.payload);
    },
    updateTask(state, action: PayloadAction<{ id: string; changes: Partial<Task> }>) {
      const t = state.items.find((x) => x.id === action.payload.id);
      if (t) Object.assign(t, action.payload.changes);
    },
    setTaskStatus(state, action: PayloadAction<{ id: string; status: TaskStatus }>) {
      const t = state.items.find((x) => x.id === action.payload.id);
      if (!t) return;
      t.status = action.payload.status;
      t.completedAt = action.payload.status === 'completed' ? new Date().toISOString() : undefined;
    },
    deleteTask(state, action: PayloadAction<string>) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(bootstrap.fulfilled, (state, action) => {
      state.items = action.payload.tasks;
    });
  },
});

export const { addTask, updateTask, setTaskStatus, deleteTask } = tasksSlice.actions;
export default tasksSlice.reducer;
