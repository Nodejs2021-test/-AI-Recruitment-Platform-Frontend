import { apiSlice } from '@/services/api/baseApi.js';

export const interviewsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInterviewSlots: builder.query<any[], void>({
      query: () => '/interviews/slots',
      providesTags: ['Slots'],
    }),
    getScheduledInterviews: builder.query<any[], void>({
      query: () => '/interviews/scheduled',
      providesTags: ['Scheduled'],
    }),
    getReminderLogs: builder.query<any[], number>({
      query: (id) => `/interviews/${id}/reminders`,
      providesTags: ['ReminderLogs'],
    }),
    getDashboardMetrics: builder.query<any, void>({
      query: () => '/interviews/dashboard-metrics',
      providesTags: ['Metrics'],
    }),
    getApplicantSlots: builder.query<any[], number>({
      query: (candidateId) => `/interviews/applicant/${candidateId}/slots`,
      providesTags: ['ApplicantSlots'],
    }),
    submitSlots: builder.mutation<any, any[]>({
      query: (slots) => ({
        url: '/interviews/slots',
        method: 'POST',
        body: { slots },
      }),
      invalidatesTags: ['Slots'],
    }),
    sendReminder: builder.mutation<any, { id: number; date: string; timeSlot: string; round: string; mode: string; link: string; instructions: string; message: string }>({
      query: ({ id, ...body }) => ({
        url: `/interviews/${id}/reminder`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ReminderLogs', 'Scheduled'],
    }),
    bookInterview: builder.mutation<any, { applicationId: number; slotId: number; interviewerName: string; meetingLink: string }>({
      query: (data) => ({
        url: '/interviews/schedule',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ApplicantSlots', 'Scheduled', 'Metrics', 'ApplicantDetails', 'Slots'],
    }),
    getAuditLogs: builder.query<any[], void>({
      query: () => '/interviews/audit-logs',
      providesTags: ['AuditLogs'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInterviewSlotsQuery,
  useGetScheduledInterviewsQuery,
  useGetReminderLogsQuery,
  useGetDashboardMetricsQuery,
  useGetApplicantSlotsQuery,
  useSubmitSlotsMutation,
  useSendReminderMutation,
  useBookInterviewMutation,
  useGetAuditLogsQuery,
} = interviewsApi;
