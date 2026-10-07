import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    registerTenant: builder.mutation({
      query: (data) => ({
        url: 'auth/register',
        method: 'POST',
        body: data,
      }),
    }),
    googleLogin: builder.mutation({
      query: (data) => ({
        url: 'auth/google',
        method: 'POST',
        body: data,
      }),
    }),
    setupWorkspace: builder.mutation({
      query: (data) => ({
        url: 'auth/setup-workspace',
        method: 'POST',
        body: data,
      }),
    }),
    uploadImage: builder.mutation({
      query: (data) => ({
        url: 'upload',
        method: 'POST',
        body: data,
      }),
    }),
    getProfile: builder.query({
      query: () => 'auth/profile',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation({
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
