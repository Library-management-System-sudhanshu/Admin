import { baseApi } from './baseApi';

export const complaintsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
      invalidatesTags: (_result, error) => error ? [] : ['Complaints'],
    }),
  }),
});

export const {
  useGetComplaintsQuery,
  useUpdateComplaintStatusMutation
} = complaintsApi;
