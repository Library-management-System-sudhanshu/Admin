import { baseApi } from './baseApi';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMetrics: builder.query({
      query: (params) => ({
        url: 'dashboard/metrics',
        params,
      }),
      providesTags: ['Metrics'],
    }),
  }),
});

export const {
  useGetMetricsQuery
} = dashboardApi;
