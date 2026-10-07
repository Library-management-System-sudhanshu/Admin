import { baseApi } from './baseApi';

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query({
      query: (params) => ({
        url: 'students',
        params,
      }),
      providesTags: ['Students', { type: 'Students', id: 'LIST' }],
    }),
    getStudentById: builder.query({
      query: (id) => `students/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Students', id }],
    }),
    createStudent: builder.mutation({
      query: (data) => ({
        url: 'students',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Students', 'Metrics'],
    }),
    updateStudent: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `students/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, error, arg) => error ? [] : [{ type: 'Students', id: 'LIST' }, { type: 'Students', id: arg.id }, 'Metrics', 'Seats'],
    }),
    updateStudentStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `students/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, error, arg) => error ? [] : [{ type: 'Students', id: 'LIST' }, { type: 'Students', id: arg.id }, 'Metrics', 'Seats'],
    }),
    deleteStudent: builder.mutation({
      query: (id) => ({
        url: `students/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error, arg) => error ? [] : [{ type: 'Students', id: 'LIST' }, { type: 'Students', id: arg }, 'Metrics', 'Seats'],
    }),
    clearStudentDues: builder.mutation({
      query: ({ id, amount, method }) => ({
        url: `students/${id}/clear-dues`,
        method: 'POST',
        body: { amount, method },
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Students', 'Payments', 'Metrics'],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateStudentStatusMutation,
  useDeleteStudentMutation,
  useClearStudentDuesMutation
} = studentsApi;
