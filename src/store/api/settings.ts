import { baseApi } from './baseApi';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    triggerSafetyAlarm: builder.mutation({
      query: (data) => ({
        url: 'safety/alarm',
        method: 'POST',
        body: data,
      }),
    }),
    getSettings: builder.query({
      query: (workspaceId) => `workspaces/${workspaceId}/settings`,
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation({
      query: ({ workspaceId, data }) => ({
        url: `workspaces/${workspaceId}/settings`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, error) => error ? [] : ['Settings'],
    }),
  }),
});

export const {
  useTriggerSafetyAlarmMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation
} = settingsApi;
