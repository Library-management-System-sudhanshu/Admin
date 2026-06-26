import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Metrics',
    'Students',
    'Seats',
    'Payments',
    'Books',
    'Complaints',
    'WhatsAppLogs',
    'Workspaces',
    'Branches',
    'Shifts',
    'Plans',
    'Notices',
    'Settings',
  ],
  endpoints: (builder) => ({
    // Auth
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

    // Dashboard Metrics
    getMetrics: builder.query({
      query: () => 'dashboard/metrics',
      providesTags: ['Metrics'],
    }),

    // Students
    getStudents: builder.query({
      query: (params) => ({
        url: 'students',
        params,
      }),
      providesTags: ['Students'],
    }),
    getStudentById: builder.query({
      query: (id) => `students/${id}`,
      providesTags: ['Students'],
    }),
    createStudent: builder.mutation({
      query: (data) => ({
        url: 'students',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Students', 'Metrics'],
    }),
    updateStudent: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `students/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Students'],
    }),
    updateStudentStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `students/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Students', 'Metrics'],
    }),
    deleteStudent: builder.mutation({
      query: (id) => ({
        url: `students/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Students', 'Metrics'],
    }),

    // Seats & Map
    getSeatMap: builder.query({
      query: (branchId) => `seats/map/${branchId}`,
      providesTags: ['Seats'],
    }),
    allocateSeat: builder.mutation({
      query: (data) => ({
        url: 'seats/allocate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Seats', 'Students', 'Metrics'],
    }),
    transferSeat: builder.mutation({
      query: (data) => ({
        url: 'seats/transfer',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Seats', 'Students', 'Metrics'],
    }),
    vacateSeat: builder.mutation({
      query: (id) => ({
        url: `seats/${id}/vacate`,
        method: 'POST',
      }),
      invalidatesTags: ['Seats', 'Students', 'Metrics'],
    }),
    updateSeatStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `seats/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Seats'],
    }),
    addFloor: builder.mutation({
      query: (data) => ({
        url: 'seats/floors',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Seats'],
    }),
    addRoom: builder.mutation({
      query: (data) => ({
        url: 'seats/rooms',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Seats'],
    }),
    addSeat: builder.mutation({
      query: (data) => ({
        url: 'seats/seats',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Seats'],
    }),
    deleteSeat: builder.mutation({
      query: (id) => ({
        url: `seats/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Seats'],
    }),
    deleteRoom: builder.mutation({
      query: (id) => ({
        url: `seats/rooms/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Seats'],
    }),
    deleteFloor: builder.mutation({
      query: (id) => ({
        url: `seats/floors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Seats'],
    }),
    updateFloor: builder.mutation({
      query: ({ id, name }) => ({
        url: `seats/floors/${id}`,
        method: 'PATCH',
        body: { name },
      }),
      invalidatesTags: ['Seats'],
    }),

    // Payments
    getPayments: builder.query({
      query: (params) => ({
        url: 'payments',
        params,
      }),
      providesTags: ['Payments'],
    }),
    getCollectionReport: builder.query({
      query: (range) => `payments/report?range=${range}`,
      providesTags: ['Payments'],
    }),
    createPayment: builder.mutation({
      query: (data) => ({
        url: 'payments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payments', 'Metrics'],
    }),
    recordManualPayment: builder.mutation({
      query: ({ id, method }) => ({
        url: `payments/${id}/manual`,
        method: 'POST',
        body: { method },
      }),
      invalidatesTags: ['Payments', 'Metrics'],
    }),

    // Library
    getBooks: builder.query({
      query: () => 'library/books',
      providesTags: ['Books'],
    }),
    createBook: builder.mutation({
      query: (data) => ({
        url: 'library/books',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Books'],
    }),
    issueBook: builder.mutation({
      query: (data) => ({
        url: 'library/books/issue',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Books'],
    }),
    returnBook: builder.mutation({
      query: (issueId) => ({
        url: `library/books/return/${issueId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Books'],
    }),
    getIssuedBooks: builder.query({
      query: () => 'library/books/issued',
      providesTags: ['Books'],
    }),

    // Complaints
    getComplaints: builder.query({
      query: () => 'complaints',
      providesTags: ['Complaints'],
    }),
    updateComplaintStatus: builder.mutation({
      query: ({ id, resolvedById, status }) => ({
        url: `complaints/${id}`,
        method: 'PATCH',
        body: { resolvedById, status },
      }),
      invalidatesTags: ['Complaints'],
    }),

    // WhatsApp Broadcasts
    getWhatsAppTemplates: builder.query({
      query: () => 'whatsapp/templates',
    }),
    sendWhatsAppBroadcast: builder.mutation({
      query: (data) => ({
        url: 'whatsapp/broadcast',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WhatsAppLogs'],
    }),
    getWhatsAppLogs: builder.query({
      query: () => 'whatsapp/logs',
      providesTags: ['WhatsAppLogs'],
    }),

    // Workspaces (Super Admin)
    getWorkspaces: builder.query({
      query: () => 'workspaces',
      providesTags: ['Workspaces'],
    }),
    updateWorkspace: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `workspaces/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Workspaces'],
    }),

    // Branches & Shifts & Plans
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
      invalidatesTags: ['Shifts'],
    }),
    updateShift: builder.mutation({
      query: ({ id, data }) => ({
        url: `workspaces/shifts/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Shifts'],
    }),
    deleteShift: builder.mutation({
      query: (id) => ({
        url: `workspaces/shifts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Shifts'],
    }),
    getPlans: builder.query({
      query: (workspaceId) => `workspaces/${workspaceId}/plans`,
      providesTags: ['Plans'],
    }),
    getNotices: builder.query({
      query: () => 'notices',
      providesTags: ['Notices'],
    }),
    createNotice: builder.mutation({
      query: (data) => ({
        url: 'notices',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Notices'],
    }),
    deleteNotice: builder.mutation({
      query: (id) => ({
        url: `notices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notices'],
    }),
    getSettings: builder.query({
      query: (workspaceId) => `workspaces/${workspaceId}/settings`,
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation({
      query: ({ workspaceId, data }) => ({
        url: `workspaces/${workspaceId}/settings`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterTenantMutation,
  useGetMetricsQuery,
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateStudentStatusMutation,
  useDeleteStudentMutation,
  useGetSeatMapQuery,
  useAllocateSeatMutation,
  useTransferSeatMutation,
  useVacateSeatMutation,
  useUpdateSeatStatusMutation,
  useAddFloorMutation,
  useAddRoomMutation,
  useAddSeatMutation,
  useDeleteSeatMutation,
  useDeleteRoomMutation,
  useDeleteFloorMutation,
  useUpdateFloorMutation,
  useGetPaymentsQuery,
  useGetCollectionReportQuery,
  useCreatePaymentMutation,
  useRecordManualPaymentMutation,
  useGetBooksQuery,
  useCreateBookMutation,
  useIssueBookMutation,
  useReturnBookMutation,
  useGetIssuedBooksQuery,
  useGetComplaintsQuery,
  useUpdateComplaintStatusMutation,
  useGetWhatsAppTemplatesQuery,
  useSendWhatsAppBroadcastMutation,
  useGetWhatsAppLogsQuery,
  useGetWorkspacesQuery,
  useUpdateWorkspaceMutation,
  useGetBranchesQuery,
  useGetShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useGetPlansQuery,
  useGetNoticesQuery,
  useCreateNoticeMutation,
  useDeleteNoticeMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} = api;

