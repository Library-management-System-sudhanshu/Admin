import { baseApi } from './baseApi';

export const messagingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
      invalidatesTags: (_result, error) => error ? [] : ['WhatsAppTemplates'],
    }),
    sendWhatsAppBroadcast: builder.mutation({
      query: (data) => ({
        url: 'whatsapp/broadcast',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['WhatsAppLogs'],
    }),
    getWhatsAppLogs: builder.query({
      query: () => 'whatsapp/logs',
      providesTags: ['WhatsAppLogs'],
    }),
    sendSmsBroadcast: builder.mutation({
      query: (data) => ({
        url: 'sms/broadcast',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['SmsLogs'],
    }),
    getSmsLogs: builder.query({
      query: () => 'sms/logs',
      providesTags: ['SmsLogs'],
    }),
    sendEmailBroadcast: builder.mutation({
      query: (data) => ({
        url: 'email/broadcast',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['EmailLogs', 'EmailStats'],
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
      invalidatesTags: (_result, error) => error ? [] : ['EmailDomain'],
    }),
    updateEmailDomain: builder.mutation({
      query: (data) => ({
        url: 'email/domain/update',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['EmailDomain'],
    }),
  }),
});

export const {
  useGetWhatsAppTemplatesQuery,
  useCreateWhatsAppTemplateMutation,
  useSendWhatsAppBroadcastMutation,
  useGetWhatsAppLogsQuery,
  useSendSmsBroadcastMutation,
  useGetSmsLogsQuery,
  useSendEmailBroadcastMutation,
  useGetEmailLogsQuery,
  useGetEmailStatsQuery,
  useGetEmailDomainQuery,
  useVerifyEmailDomainMutation,
  useUpdateEmailDomainMutation
} = messagingApi;
