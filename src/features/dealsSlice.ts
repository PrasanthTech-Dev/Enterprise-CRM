import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { bootstrap } from '@/app/bootstrap';
import type { Deal, DealStage } from '@/types';
import { stageMeta } from '@/utils/constants';

const dealsSlice = createSlice({
  name: 'deals',
  initialState: { items: [] as Deal[] },
  reducers: {
    addDeal(state, action: PayloadAction<Deal>) {
      state.items.unshift(action.payload);
    },
    updateDeal(state, action: PayloadAction<{ id: string; changes: Partial<Deal> }>) {
      const deal = state.items.find((d) => d.id === action.payload.id);
      if (deal) Object.assign(deal, action.payload.changes);
    },
    moveDeal(state, action: PayloadAction<{ id: string; stage: DealStage }>) {
      const deal = state.items.find((d) => d.id === action.payload.id);
      if (!deal || deal.stage === action.payload.stage) return;
      deal.stage = action.payload.stage;
      deal.probability = stageMeta(action.payload.stage).probability;
      const closed = action.payload.stage === 'won' || action.payload.stage === 'lost';
      deal.closedAt = closed ? new Date().toISOString() : undefined;
    },
    deleteDeal(state, action: PayloadAction<string>) {
      state.items = state.items.filter((d) => d.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(bootstrap.fulfilled, (state, action) => {
      state.items = action.payload.deals;
    });
  },
});

export const { addDeal, updateDeal, moveDeal, deleteDeal } = dealsSlice.actions;
export default dealsSlice.reducer;
