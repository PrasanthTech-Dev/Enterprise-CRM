import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { bootstrap } from '@/app/bootstrap';
import type { FollowUp, Lead, LeadStatus } from '@/types';

const leadsSlice = createSlice({
  name: 'leads',
  initialState: { items: [] as Lead[] },
  reducers: {
    addLead(state, action: PayloadAction<Lead>) {
      state.items.unshift(action.payload);
    },
    updateLead(state, action: PayloadAction<{ id: string; changes: Partial<Lead> }>) {
      const lead = state.items.find((l) => l.id === action.payload.id);
      if (lead) Object.assign(lead, action.payload.changes, { updatedAt: new Date().toISOString() });
    },
    setLeadStatus(state, action: PayloadAction<{ id: string; status: LeadStatus }>) {
      const lead = state.items.find((l) => l.id === action.payload.id);
      if (lead) {
        lead.status = action.payload.status;
        lead.updatedAt = new Date().toISOString();
      }
    },
    deleteLead(state, action: PayloadAction<string>) {
      state.items = state.items.filter((l) => l.id !== action.payload);
    },
    addFollowUp(state, action: PayloadAction<{ leadId: string; followUp: FollowUp }>) {
      const lead = state.items.find((l) => l.id === action.payload.leadId);
      if (lead) {
        lead.followUps.push(action.payload.followUp);
        lead.updatedAt = new Date().toISOString();
      }
    },
    toggleFollowUp(state, action: PayloadAction<{ leadId: string; followUpId: string }>) {
      const lead = state.items.find((l) => l.id === action.payload.leadId);
      const fu = lead?.followUps.find((f) => f.id === action.payload.followUpId);
      if (fu) fu.done = !fu.done;
    },
    removeFollowUp(state, action: PayloadAction<{ leadId: string; followUpId: string }>) {
      const lead = state.items.find((l) => l.id === action.payload.leadId);
      if (lead) lead.followUps = lead.followUps.filter((f) => f.id !== action.payload.followUpId);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(bootstrap.fulfilled, (state, action) => {
      state.items = action.payload.leads;
    });
  },
});

export const { addLead, updateLead, setLeadStatus, deleteLead, addFollowUp, toggleFollowUp, removeFollowUp } =
  leadsSlice.actions;
export default leadsSlice.reducer;
