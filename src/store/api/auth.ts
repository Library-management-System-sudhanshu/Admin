import { baseApi } from './baseApi';
import type { User, AuthCredentials } from '../../types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthCredentials, { email: string; password?: string }>({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    registerTenant: builder.mutation<AuthCredentials, Record<string, unknown>>({
      query: (data) => ({
        url: 'auth/register',
        method: 'POST',
        body: data,
      }),
    }),
    googleLogin: builder.mutation<AuthCredentials, { idToken: string }>({
      query: (data) => ({
        url: 'auth/google',
        method: 'POST',
        body: data,
      }),
    }),
    setupWorkspace: builder.mutation<any, Record<string, unknown>>({
      query: (data) => ({
        url: 'auth/setup-workspace',
        method: 'POST',
        body: data,
      }),
    }),
    uploadImage: builder.mutation<{ url: string }, { base64: string } | FormData>({
      query: (data) => ({
        url: 'upload',
        method: 'POST',
        body: data,
      }),
    }),
    getProfile: builder.query<User, void>({
      query: () => 'auth/profile',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<User, Partial<User>>({
      query: (data) => ({
        url: 'auth/profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Profile'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterTenantMutation,
  useGoogleLoginMutation,
  useSetupWorkspaceMutation,
  useUploadImageMutation,
  useGetProfileQuery,
  useUpdateProfileMutation
} = authApi;
