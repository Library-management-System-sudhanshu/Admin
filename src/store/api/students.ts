import { baseApi } from './baseApi';
import type { Student } from '../../types';

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<any, Record<string, unknown> | void>({
      query: (params) => ({
        url: 'students',
        params: params || undefined,
      }),
      providesTags: ['Students', { type: 'Students', id: 'LIST' }],
    }),
    getStudentById: builder.query<any, string>({
      query: (id) => `students/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Students', id }],
    }),
    createStudent: builder.mutation<Student, Partial<Student>>({
      query: (data) => ({
        url: 'students',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Students', 'Metrics'],
    }),
    updateStudent: builder.mutation<Student, { id: string } & Partial<Student>>({
      query: ({ id, ...data }) => ({
        url: `students/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, error, arg) => error ? [] : [{ type: 'Students', id: 'LIST' }, { type: 'Students', id: arg.id }, 'Metrics', 'Seats'],
    }),
    updateStudentStatus: builder.mutation<Student, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `students/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, error, arg) => error ? [] : [{ type: 'Students', id: 'LIST' }, { type: 'Students', id: arg.id }, 'Metrics', 'Seats'],
    }),
    deleteStudent: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `students/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error, arg) => error ? [] : [{ type: 'Students', id: 'LIST' }, { type: 'Students', id: arg }, 'Metrics', 'Seats'],
    }),
    clearStudentDues: builder.mutation<Student, { id: string; amount: number; method: string }>({
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
