import { baseApi } from './baseApi';

export const libraryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
      invalidatesTags: (_result, error) => error ? [] : ['Books'],
    }),
    issueBook: builder.mutation({
      query: (data) => ({
        url: 'library/books/issue',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Books'],
    }),
    returnBook: builder.mutation({
      query: (issueId) => ({
        url: `library/books/return/${issueId}`,
        method: 'POST',
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Books'],
    }),
    getIssuedBooks: builder.query({
      query: () => 'library/books/issued',
      providesTags: ['Books'],
    }),
  }),
});

export const {
  useGetBooksQuery,
  useCreateBookMutation,
  useIssueBookMutation,
  useReturnBookMutation,
  useGetIssuedBooksQuery
} = libraryApi;
