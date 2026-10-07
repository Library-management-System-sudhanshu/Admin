import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { logout, type AuthState } from '../authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: AuthState }).auth.token;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

const authenticatedQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, options) => {
  const requestToken = (api.getState() as { auth: AuthState }).auth.token;
  const result = await baseQuery(args, api, options);
  // A late response from the previous account must not affect the current session.
  if (requestToken !== (api.getState() as { auth: AuthState }).auth.token) {
    return { error: { status: 'CUSTOM_ERROR', error: 'Session changed' } };
  }
  if (requestToken && result.error) {
    const message = (result.error.data as { message?: unknown } | undefined)?.message;
    if (result.error.status === 401) api.dispatch(logout('expired'));
    if (result.error.status === 403 && typeof message === 'string' && message.includes('disabled')) api.dispatch(logout('disabled'));
  }
  return result;
};

/** All feature modules inject into this single reducer/cache and middleware. */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: authenticatedQuery,
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: 60,
  refetchOnReconnect: true,
  tagTypes: ['Profile',
    'Metrics',
    'Students',
    'Seats',
    'Payments',
    'Books',
    'Complaints',
    'WhatsAppLogs',
    'WhatsAppTemplates',
    'Workspaces',
    'Branches',
    'Shifts',
    'Plans',
    'Notices',
    'Settings',
    'SaaSPlans',
    'SaaSSubscription',
    'SuperAdminMetrics',
    'SmsLogs',
    'EmailLogs',
    'EmailStats',
    'EmailDomain',

  ],
  endpoints: () => ({}),
});
