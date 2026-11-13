import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { bootstrap } from '@/app/bootstrap';
import type { ToastItem } from '@/types';
import { uid } from '@/utils/format';

interface UiState {
  dataStatus: 'idle' | 'loading' | 'ready' | 'error';
  dataError: string | null;
  sidebarOpen: boolean;
  toasts: ToastItem[];
}

const initialState: UiState = { dataStatus: 'idle', dataError: null, sidebarOpen: false, toasts: [] };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state, action: PayloadAction<boolean | undefined>) {
      state.sidebarOpen = action.payload ?? !state.sidebarOpen;
    },
    pushToast: {
      reducer(state, action: PayloadAction<ToastItem>) {
        state.toasts.push(action.payload);
      },
      prepare(toast: Omit<ToastItem, 'id'>) {
        return { payload: { ...toast, id: uid('toast') } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrap.pending, (state) => {
        state.dataStatus = 'loading';
        state.dataError = null;
      })
      .addCase(bootstrap.fulfilled, (state) => {
        state.dataStatus = 'ready';
      })
      .addCase(bootstrap.rejected, (state, action) => {
        state.dataStatus = 'error';
        state.dataError = action.error.message ?? 'Something went wrong while loading your data.';
      });
  },
});

export const { toggleSidebar, pushToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;
