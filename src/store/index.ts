import { configureStore, type Middleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi as api } from './api/baseApi';
import authReducer, { logout, setCredentials, type AuthState } from './authSlice';

// Reset on logout/account/workspace changes, but preserve cache on profile edits.
const sessionCacheMiddleware: Middleware = (store) => (next) => (action) => {
  const before = (store.getState() as { auth: AuthState }).auth;
  const result = next(action);
  if (logout.match(action) || (setCredentials.match(action) && (
    before.user?.id !== action.payload.user.id ||
    before.user?.workspaceId !== action.payload.user.workspaceId ||
    before.token !== action.payload.accessToken
  ))) store.dispatch(api.util.resetApiState());
  return result;
};

export const store = configureStore({
  reducer: { [api.reducerPath]: api.reducer, auth: authReducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sessionCacheMiddleware, api.middleware),
});
setupListeners(store.dispatch);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
