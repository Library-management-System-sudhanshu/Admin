import { baseApi } from './baseApi';

export const noticesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
      invalidatesTags: (_result, error) => error ? [] : ['Notices'],
    }),
    deleteNotice: builder.mutation({
      query: (id) => ({
        url: `notices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Notices'],
    }),
  }),
});

export const {
  useGetNoticesQuery,
  useCreateNoticeMutation,
  useDeleteNoticeMutation
} = noticesApi;
