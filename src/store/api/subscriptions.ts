import { baseApi } from './baseApi';

export const subscriptionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
      invalidatesTags: (_result, error) => error ? [] : ['SaaSPlans'],
    }),
    updateSaaSPlan: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `saas-plans/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['SaaSPlans'],
    }),
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
      invalidatesTags: (_result, error) => error ? [] : ['SaaSSubscription'],
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
      invalidatesTags: (_result, error) => error ? [] : ['SaaSSubscription'],
    }),
  }),
});

export const {
  useGetSaaSPlansQuery,
  useCreateSaaSPlanMutation,
  useUpdateSaaSPlanMutation,
  useGetSaaSSubscriptionQuery,
  useStartSaaSTrialMutation,
  useCreateSaaSPaymentMutation,
  useVerifySaaSPaymentMutation
} = subscriptionsApi;
