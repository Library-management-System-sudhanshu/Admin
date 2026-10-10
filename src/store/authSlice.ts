import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';

export interface AuthState {
  logoutReason?: 'expired' | 'disabled';
  user: User | null;
  token: string | null;
}

function readSession(): AuthState {
  try {
    const rawUser = localStorage.getItem('user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    const token = localStorage.getItem('token');
    return user && typeof user.id === 'string' && typeof user.role === 'string' && token ? { user, token } : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
}
const initialState = readSession();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      state.logoutReason = undefined;
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.accessToken);
    },
    logout: (state, action: PayloadAction<'expired' | 'disabled' | undefined>) => {
      state.logoutReason = action.payload;
      state.user = null;
      state.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
