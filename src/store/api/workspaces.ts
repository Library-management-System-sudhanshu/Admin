import { baseApi } from './baseApi';

export const workspacesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaces: builder.query({
      query: () => 'workspaces',
      providesTags: ['Workspaces'],
    }),
    getWorkspaceById: builder.query({
      query: (id) => `workspaces/${id}`,
      providesTags: ['Workspaces'],
    }),
    getSuperAdminMetrics: builder.query({
      query: () => 'dashboard/super-admin/metrics',
      providesTags: ['SuperAdminMetrics'],
    }),
    updateWorkspace: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `workspaces/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Workspaces', 'SuperAdminMetrics'],
    }),
    createWorkspace: builder.mutation({
      query: (data) => ({
        url: 'workspaces',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Workspaces', 'SuperAdminMetrics'],
    }),
    deleteWorkspace: builder.mutation({
      query: (id) => ({
        url: `workspaces/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Workspaces', 'SuperAdminMetrics'],
    }),
    getBranches: builder.query({
      query: (workspaceId) => `workspaces/${workspaceId}/branches`,
      providesTags: ['Branches'],
    }),
    getShifts: builder.query({
      query: (workspaceId) => `workspaces/${workspaceId}/shifts`,
      providesTags: ['Shifts'],
    }),
    createShift: builder.mutation({
      query: ({ workspaceId, data }) => ({
        url: `workspaces/${workspaceId}/shifts`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Shifts'],
    }),
    updateShift: builder.mutation({
      query: ({ id, data }) => ({
        url: `workspaces/shifts/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Shifts'],
    }),
    deleteShift: builder.mutation({
      query: (id) => ({
        url: `workspaces/shifts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Shifts'],
    }),
    getPlans: builder.query({
      query: (workspaceId) => `workspaces/${workspaceId}/plans`,
      providesTags: ['Plans'],
    }),
  }),
});

export const {
  useGetWorkspacesQuery,
  useGetWorkspaceByIdQuery,
  useGetSuperAdminMetricsQuery,
  useUpdateWorkspaceMutation,
  useCreateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useGetBranchesQuery,
  useGetShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useGetPlansQuery
} = workspacesApi;
