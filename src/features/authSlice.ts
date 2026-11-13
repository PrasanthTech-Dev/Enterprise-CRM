import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { bootstrap, type SeedData } from '@/app/bootstrap';
import { buildUsers } from '@/data/seed';
import type { Preferences, User } from '@/types';
import { delay, storage } from '@/utils/async';
import { DEMO_OTP } from '@/utils/constants';

interface ResetFlow {
  email: string | null;
  otpVerified: boolean;
}

interface AuthState {
  users: User[];
  currentUserId: string | null;
  reset: ResetFlow;
}

const getInitialUsers = (): User[] => {
  const saved = storage.get<SeedData>('data');
  if (saved && Array.isArray(saved.users) && saved.users.length > 0) {
    return saved.users;
  }
  return buildUsers();
};

const initialState: AuthState = {
  users: getInitialUsers(),
  currentUserId: storage.get<{ userId: string }>('session')?.userId ?? null,
  reset: { email: null, otpVerified: false },
};

export interface LoginPayload {
  email?: string;
  phone?: string;
  identifier?: string;
  password: string;
  remember: boolean;
  mode?: 'email' | 'phone';
}

function formatDisplayName(identifier: string, mode: 'email' | 'phone'): string {
  if (mode === 'phone') {
    const digits = identifier.replace(/\D/g, '');
    const last4 = digits.slice(-4) || 'User';
    return `User ${last4}`;
  }
  const namePart = identifier.split('@')[0] || 'User';
  const words = namePart
    .replace(/[._\-+]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.length > 0 ? words.join(' ') : 'Enterprise User';
}

export const login = createAsyncThunk<
  { userId: string; user: User },
  LoginPayload,
  { state: { auth: AuthState }; rejectValue: string }
>(
  'auth/login',
  async (
    { email, phone, identifier, password, mode = 'email' },
    { getState, rejectWithValue },
  ) => {
    await delay(500);
    const target = (identifier || (mode === 'phone' ? phone : email) || '').trim();
    if (!target) {
      return rejectWithValue(mode === 'phone' ? 'Phone number is required.' : 'Email is required.');
    }
    if (!password || !password.trim()) {
      return rejectWithValue('Password is required.');
    }

    const clean = target.toLowerCase();
    const digitsOnly = target.replace(/\D/g, '');

    const currentUsers = getState().auth.users;
    let user = currentUsers.find((u) => {
      if (mode === 'phone') {
        const uPhoneDigits = u.phone.replace(/\D/g, '');
        return u.phone.toLowerCase() === clean || (digitsOnly.length >= 7 && uPhoneDigits.endsWith(digitsOnly));
      }
      return u.email.toLowerCase() === clean;
    });

    if (user) {
      // User found in system - if password differs, update it to whatever user supplied so they are never blocked
      if (password && user.password !== password) {
        user = { ...user, password };
      }
    } else {
      // Auto-create new user account with manager privileges so they have full CRM access
      const newId = `u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const derivedName = formatDisplayName(target, mode);
      const isEmail = mode === 'email' || target.includes('@');

      user = {
        id: newId,
        name: derivedName,
        email: isEmail ? target : `${digitsOnly || 'user'}@enterprisecrm.com`,
        phone: !isEmail ? target : '+1 555 0199',
        password,
        role: 'manager',
        department: 'Sales',
        title: 'Sales Manager',
        bio: 'Enterprise CRM Account User.',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        monthlyTarget: 100000,
        joinedAt: new Date().toISOString(),
        preferences: {
          emailAlerts: true,
          leadAssignments: true,
          taskReminders: true,
          meetingReminders: true,
          weeklyDigest: true,
        },
      };
    }

    // Persist active session
    storage.set('session', { userId: user.id });

    // Sync to persistent 'data' in localStorage so page reloads keep this user
    try {
      let savedData = storage.get<SeedData>('data');
      if (!savedData || !Array.isArray(savedData.users)) {
        savedData = {
          users: buildUsers(),
          leads: [],
          deals: [],
          customers: [],
          tasks: [],
          activities: [],
          notifications: [],
        } as unknown as SeedData;
      }
      const idx = savedData.users.findIndex((u) => u.id === user!.id);
      if (idx >= 0) {
        savedData.users[idx] = user;
      } else {
        savedData.users.push(user);
      }
      storage.set('data', savedData);
    } catch (e) {
      console.warn('Could not sync user to storage data:', e);
    }

    return { userId: user.id, user };
  },
);

export const requestPasswordReset = createAsyncThunk<
  string,
  string,
  { state: { auth: AuthState }; rejectValue: string }
>('auth/requestReset', async (email) => {
  await delay(600);
  return email.trim().toLowerCase();
});

export const verifyOtp = createAsyncThunk<boolean, string, { rejectValue: string }>(
  'auth/verifyOtp',
  async (code, { rejectWithValue }) => {
    await delay(500);
    if (code !== DEMO_OTP) return rejectWithValue('That code is incorrect or has expired. Please try again.');
    return true;
  },
);

export const resendOtp = createAsyncThunk('auth/resendOtp', async () => {
  await delay(500);
  return true;
});

export const resetPassword = createAsyncThunk<
  string,
  string,
  { state: { auth: AuthState }; rejectValue: string }
>('auth/resetPassword', async (newPassword, { getState, rejectWithValue }) => {
  await delay(600);
  const { reset } = getState().auth;
  if (!reset.email || !reset.otpVerified) return rejectWithValue('Your reset session has expired. Please start again.');
  return newPassword;
});

export const changePassword = createAsyncThunk<
  string,
  { current: string; next: string },
  { state: { auth: AuthState }; rejectValue: string }
>('auth/changePassword', async ({ current, next }, { getState, rejectWithValue }) => {
  await delay(600);
  const { users, currentUserId } = getState().auth;
  const me = users.find((u) => u.id === currentUserId);
  if (!me) return rejectWithValue('You need to be signed in.');
  if (me.password !== current) return rejectWithValue('Your current password is incorrect.');
  if (me.password === next) return rejectWithValue('Choose a password different from your current one.');
  return next;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.currentUserId = null;
      storage.remove('session');
    },
    updateProfile(state, action: PayloadAction<Partial<Omit<User, 'id' | 'password' | 'role'>>>) {
      const me = state.users.find((u) => u.id === state.currentUserId);
      if (me) Object.assign(me, action.payload);
    },
    updatePreferences(state, action: PayloadAction<Partial<Preferences>>) {
      const me = state.users.find((u) => u.id === state.currentUserId);
      if (me) me.preferences = { ...me.preferences, ...action.payload };
    },
    clearResetFlow(state) {
      state.reset = { email: null, otpVerified: false };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrap.fulfilled, (state, action) => {
        const loadedUsers = action.payload.users;
        const userMap = new Map<string, User>();
        for (const u of loadedUsers) {
          userMap.set(u.id, u);
        }
        for (const u of state.users) {
          if (!userMap.has(u.id)) {
            userMap.set(u.id, u);
          }
        }
        state.users = Array.from(userMap.values());
        if (state.currentUserId && !state.users.some((u) => u.id === state.currentUserId)) {
          state.currentUserId = null;
        }
      })
      .addCase(login.fulfilled, (state, action) => {
        const { userId, user } = action.payload;
        state.currentUserId = userId;
        const idx = state.users.findIndex((u) => u.id === userId);
        if (idx >= 0) {
          state.users[idx] = user;
        } else {
          state.users.push(user);
        }
      })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.reset = { email: action.payload, otpVerified: false };
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.reset.otpVerified = true;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        const cleanEmail = state.reset.email?.toLowerCase();
        let user = state.users.find((u) => u.email.toLowerCase() === cleanEmail);
        if (user) {
          user.password = action.payload;
        } else if (cleanEmail) {
          const newId = `u_${Date.now()}`;
          user = {
            id: newId,
            name: formatDisplayName(cleanEmail, 'email'),
            email: cleanEmail,
            phone: '+1 555 0199',
            password: action.payload,
            role: 'manager',
            department: 'Sales',
            title: 'Sales Manager',
            bio: 'Enterprise CRM Account User.',
            timezone: 'Asia/Kolkata',
            monthlyTarget: 100000,
            joinedAt: new Date().toISOString(),
            preferences: {
              emailAlerts: true,
              leadAssignments: true,
              taskReminders: true,
              meetingReminders: true,
              weeklyDigest: true,
            },
          };
          state.users.push(user);
        }
        state.reset = { email: null, otpVerified: false };
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        const me = state.users.find((u) => u.id === state.currentUserId);
        if (me) me.password = action.payload;
      });
  },
});

export const { logout, updateProfile, updatePreferences, clearResetFlow } = authSlice.actions;
export default authSlice.reducer;
