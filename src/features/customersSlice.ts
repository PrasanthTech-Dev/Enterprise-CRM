import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { bootstrap } from '@/app/bootstrap';
import type { Customer } from '@/types';

const customersSlice = createSlice({
  name: 'customers',
  initialState: { items: [] as Customer[] },
  reducers: {
    addCustomer(state, action: PayloadAction<Customer>) {
      state.items.unshift(action.payload);
    },
    updateCustomer(state, action: PayloadAction<{ id: string; changes: Partial<Customer> }>) {
      const c = state.items.find((x) => x.id === action.payload.id);
      if (c) Object.assign(c, action.payload.changes);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(bootstrap.fulfilled, (state, action) => {
      state.items = action.payload.customers;
    });
  },
});

export const { addCustomer, updateCustomer } = customersSlice.actions;
export default customersSlice.reducer;
