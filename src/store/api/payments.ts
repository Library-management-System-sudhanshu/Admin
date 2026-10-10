import { baseApi } from './baseApi';

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query({
      query: (params) => ({
        url: 'payments',
        params,
      }),
      providesTags: ['Payments'],
    }),
    getStudentPayments: builder.query({
      query: (studentProfileId: string) => ({
        url: 'payments',
        params: { studentProfileId },
      }),
      providesTags: (_result, _error, id) => [{ type: 'Payments', id }],
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
      invalidatesTags: (_result, error) => error ? [] : ['Payments', 'Students', 'Metrics'],
    }),
    recordManualPayment: builder.mutation({
      query: ({ id, method }) => ({
        url: `payments/${id}/manual`,
        method: 'POST',
        body: { method },
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Payments', 'Students', 'Metrics'],
    }),
    verifyRazorpay: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `payments/${id}/verify`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Payments', 'Seats', 'Students', 'Metrics'],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetStudentPaymentsQuery,
  useGetCollectionReportQuery,
  useCreatePaymentMutation,
  useRecordManualPaymentMutation,
  useVerifyRazorpayMutation
} = paymentsApi;

