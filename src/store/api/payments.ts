import { baseApi } from './baseApi';
import type { Payment, CollectionReport } from '../../types';

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPayments: builder.query<Payment[], Record<string, unknown> | void>({
      query: (params) => ({
        url: 'payments',
        params: params || undefined,
      }),
      providesTags: ['Payments'],
    }),
    getStudentPayments: builder.query<any, string>({
      query: (studentProfileId: string) => ({
        url: 'payments',
        params: { studentProfileId },
      }),
      providesTags: (_result, _error, id) => [{ type: 'Payments', id }],
    }),
    getCollectionReport: builder.query<CollectionReport, string>({
      query: (range) => `payments/report?range=${range}`,
      providesTags: ['Payments'],
    }),
    createPayment: builder.mutation<any, any>({
      query: (data) => ({
        url: 'payments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Payments', 'Students', 'Metrics'],
    }),
    recordManualPayment: builder.mutation<Payment, { id: string; method: string }>({
      query: ({ id, method }) => ({
        url: `payments/${id}/manual`,
        method: 'POST',
        body: { method },
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Payments', 'Students', 'Metrics'],
    }),
    verifyRazorpay: builder.mutation<any, any>({
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
