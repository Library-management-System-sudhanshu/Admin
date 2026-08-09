import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from './authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as any).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    const errorData = result.error.data as any;
    if (errorData?.message === 'Token has expired') {
      api.dispatch(logout());
      window.location.href = '/login?expired=true';
    }
  }
  if (result.error && result.error.status === 403) {
    const errorData = result.error.data as any;
    if (errorData?.message?.includes('disabled')) {
      api.dispatch(logout());
      window.location.href = '/login?disabled=true';
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
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
      providesTags: ['Settings'],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: 'auth/profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Settings'],
    }),

    // Dashboard Metrics
    getMetrics: builder.query({
      query: (params) => ({
        url: 'dashboard/metrics',
        params,
      }),
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
    clearStudentDues: builder.mutation({
      query: ({ id, amount, method }) => ({
        url: `students/${id}/clear-dues`,
        method: 'POST',
        body: { amount, method },
      }),
      invalidatesTags: ['Students', 'Payments', 'Metrics'],
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
    updateAllocation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `seats/allocations/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Seats', 'Students', 'Metrics'],
    }),
    vacateSeat: builder.mutation({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : arg.id;
        const studentProfileId = typeof arg === 'object' ? arg.studentProfileId : undefined;
        return {
          url: `seats/${id}/vacate`,
          method: 'POST',
          body: studentProfileId ? { studentProfileId } : undefined,
        };
      },
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
    updateSeatLayout: builder.mutation({
      query: ({ roomId, layout, canvasWidth, canvasHeight, spacers }) => ({
        url: 'seats/layout',
        method: 'PUT',
        body: { roomId, layout, canvasWidth, canvasHeight, spacers },
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
    addBulkSeats: builder.mutation({
      query: (data) => ({
        url: 'seats/seats/bulk',
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
    updateRoom: builder.mutation({
      query: ({ id, name }) => ({
        url: `seats/rooms/${id}`,
        method: 'PATCH',
        body: { name },
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
    verifyRazorpay: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `payments/${id}/verify`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payments', 'Seats', 'Students', 'Metrics'],
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
      providesTags: ['WhatsAppTemplates'],
    }),
    createWhatsAppTemplate: builder.mutation({
      query: (data) => ({
        url: 'whatsapp/templates',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WhatsAppTemplates'],
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
      invalidatesTags: ['Workspaces', 'SuperAdminMetrics'],
    }),
    createWorkspace: builder.mutation({
      query: (data) => ({
        url: 'workspaces',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Workspaces', 'SuperAdminMetrics'],
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
    triggerSafetyAlarm: builder.mutation({
      query: (data) => ({
        url: 'safety/alarm',
        method: 'POST',
        body: data,
      }),
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
    // SaaS Plans (Trishul HQ)
    getSaaSPlans: builder.query({
      query: () => 'saas-plans',
      providesTags: ['SaaSPlans'],
    }),
    createSaaSPlan: builder.mutation({
      query: (data) => ({
        url: 'saas-plans',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SaaSPlans'],
    }),
    updateSaaSPlan: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `saas-plans/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SaaSPlans'],
    }),
    
    // SaaS Subscriptions (Library Owner's Workspace)
    getSaaSSubscription: builder.query({
      query: (workspaceId) => `workspaces/${workspaceId}/saas-subscription`,
      providesTags: ['SaaSSubscription'],
    }),
    startSaaSTrial: builder.mutation({
      query: ({ workspaceId, days }) => ({
        url: `workspaces/${workspaceId}/start-trial`,
        method: 'POST',
        body: { days },
      }),
      invalidatesTags: ['SaaSSubscription'],
    }),
    createSaaSPayment: builder.mutation({
      query: ({ workspaceId, saasPlanId }) => ({
        url: `workspaces/${workspaceId}/saas-payment/create`,
        method: 'POST',
        body: { saasPlanId },
      }),
    }),
    verifySaaSPayment: builder.mutation({
      query: ({ workspaceId, paymentData }) => ({
        url: `workspaces/${workspaceId}/saas-payment/verify`,
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['SaaSSubscription'],
    }),

    // SMS Broadcast
    sendSmsBroadcast: builder.mutation({
      query: (data) => ({
        url: 'sms/broadcast',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SmsLogs'],
    }),
    getSmsLogs: builder.query({
      query: () => 'sms/logs',
      providesTags: ['SmsLogs'],
    }),

    // Email Broadcast (Resend)
    sendEmailBroadcast: builder.mutation({
      query: (data) => ({
        url: 'email/broadcast',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['EmailLogs', 'EmailStats'],
    }),
    getEmailLogs: builder.query({
      query: () => 'email/logs',
      providesTags: ['EmailLogs'],
    }),
    getEmailStats: builder.query({
      query: () => 'email/stats',
      providesTags: ['EmailStats'],
    }),
    getEmailDomain: builder.query({
      query: (name = 'trishulindustries.online') => `email/domain?name=${encodeURIComponent(name)}`,
      providesTags: ['EmailDomain'],
    }),
    verifyEmailDomain: builder.mutation({
      query: (id) => ({
        url: 'email/domain/verify',
        method: 'POST',
        body: { id },
      }),
      invalidatesTags: ['EmailDomain'],
    }),
    updateEmailDomain: builder.mutation({
      query: (data) => ({
        url: 'email/domain/update',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['EmailDomain'],
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
  useUpdateProfileMutation,
  useGetMetricsQuery,
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateStudentStatusMutation,
  useDeleteStudentMutation,
  useClearStudentDuesMutation,
  useGetSeatMapQuery,
  useAllocateSeatMutation,
  useTransferSeatMutation,
  useUpdateAllocationMutation,
  useVacateSeatMutation,
  useUpdateSeatStatusMutation,
  useUpdateSeatLayoutMutation,
  useAddFloorMutation,
  useAddRoomMutation,
  useAddSeatMutation,
  useAddBulkSeatsMutation,
  useDeleteSeatMutation,
  useDeleteRoomMutation,
  useDeleteFloorMutation,
  useUpdateRoomMutation,
  useUpdateFloorMutation,
  useGetPaymentsQuery,
  useGetCollectionReportQuery,
  useCreatePaymentMutation,
  useRecordManualPaymentMutation,
  useVerifyRazorpayMutation,
  useGetBooksQuery,
  useCreateBookMutation,
  useIssueBookMutation,
  useReturnBookMutation,
  useGetIssuedBooksQuery,
  useGetComplaintsQuery,
  useUpdateComplaintStatusMutation,
  useGetWhatsAppTemplatesQuery,
  useCreateWhatsAppTemplateMutation,
  useSendWhatsAppBroadcastMutation,
  useGetWhatsAppLogsQuery,
  useGetWorkspacesQuery,
  useGetWorkspaceByIdQuery,
  useGetSuperAdminMetricsQuery,
  useUpdateWorkspaceMutation,
  useCreateWorkspaceMutation,
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
  useTriggerSafetyAlarmMutation,
  useGetSaaSPlansQuery,
  useCreateSaaSPlanMutation,
  useUpdateSaaSPlanMutation,
  useGetSaaSSubscriptionQuery,
  useStartSaaSTrialMutation,
  useCreateSaaSPaymentMutation,
  useVerifySaaSPaymentMutation,
  useSendSmsBroadcastMutation,
  useGetSmsLogsQuery,
  useSendEmailBroadcastMutation,
  useGetEmailLogsQuery,
  useGetEmailStatsQuery,
  useGetEmailDomainQuery,
  useVerifyEmailDomainMutation,
  useUpdateEmailDomainMutation,
} = api;

