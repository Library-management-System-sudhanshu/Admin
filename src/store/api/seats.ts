import { baseApi } from './baseApi';

export const seatsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSeatMap: builder.query({
      query: (branchId) => `seats/map/${branchId}`,
      providesTags: ['Seats'],
    }),
    allocateSeat: builder.mutation({
      query: (data) => ({
        url: 'seats/allocate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats', 'Students', 'Metrics'],
    }),
    transferSeat: builder.mutation({
      query: (data) => ({
        url: 'seats/transfer',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats', 'Students', 'Metrics'],
    }),
    updateAllocation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `seats/allocations/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats', 'Students', 'Metrics'],
    }),
    vacateSeat: builder.mutation({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : arg.id;
        const studentProfileId = typeof arg === 'object' ? arg.studentProfileId : undefined;
        return {
          url: `seats/${id}/vacate`,
          method: 'POST',
          body: studentProfileId ? { studentProfileId } : undefined,
        };
      },
      invalidatesTags: (_result, error) => error ? [] : ['Seats', 'Students', 'Metrics'],
    }),
    updateSeatStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `seats/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats'],
    }),
    updateSeatLayout: builder.mutation({
      query: ({ roomId, layout, canvasWidth, canvasHeight, spacers }) => ({
        url: 'seats/layout',
        method: 'PUT',
        body: { roomId, layout, canvasWidth, canvasHeight, spacers },
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats'],
    }),
    addFloor: builder.mutation({
      query: (data) => ({
        url: 'seats/floors',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats'],
    }),
    addRoom: builder.mutation({
      query: (data) => ({
        url: 'seats/rooms',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats'],
    }),
    addSeat: builder.mutation({
      query: (data) => ({
        url: 'seats/seats',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats'],
    }),
    addBulkSeats: builder.mutation({
      query: (data) => ({
        url: 'seats/seats/bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats'],
    }),
    deleteSeat: builder.mutation({
      query: (id) => ({
        url: `seats/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats'],
    }),
    deleteRoom: builder.mutation({
      query: (id) => ({
        url: `seats/rooms/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats'],
    }),
    updateRoom: builder.mutation({
      query: ({ id, name }) => ({
        url: `seats/rooms/${id}`,
        method: 'PATCH',
        body: { name },
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats'],
    }),
    deleteFloor: builder.mutation({
      query: (id) => ({
        url: `seats/floors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats'],
    }),
    updateFloor: builder.mutation({
      query: ({ id, name }) => ({
        url: `seats/floors/${id}`,
        method: 'PATCH',
        body: { name },
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Seats'],
    }),
  }),
});

export const {
  useGetSeatMapQuery,
  useAllocateSeatMutation,
  useTransferSeatMutation,
  useUpdateAllocationMutation,
  useVacateSeatMutation,
  useUpdateSeatStatusMutation,
  useUpdateSeatLayoutMutation,
  useAddFloorMutation,
  useAddRoomMutation,
  useAddSeatMutation,
  useAddBulkSeatsMutation,
  useDeleteSeatMutation,
  useDeleteRoomMutation,
  useUpdateRoomMutation,
  useDeleteFloorMutation,
  useUpdateFloorMutation
} = seatsApi;
