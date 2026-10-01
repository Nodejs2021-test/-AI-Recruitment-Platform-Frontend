import { apiSlice } from '@/services/api/baseApi.js';

export const candidatesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCandidateApplications: builder.query<any[], void>({
      query: () => '/candidates/applications',
      providesTags: ['Applications'],
    }),
    getCandidateProfile: builder.query<any, void>({
      query: () => '/candidates/profile',
      providesTags: ['Profile'],
    }),
    getApplicants: builder.query<any[], void>({
      query: () => '/candidates/applicants',
      providesTags: ['Applicants'],
    }),
    getApplicantDetails: builder.query<any, number>({
      query: (id) => `/candidates/applicants/${id}`,
      providesTags: ['ApplicantDetails'],
    }),
    getRejectionFeedback: builder.query<{ feedback: string }, number>({
      query: (id) => `/candidates/applications/${id}/rejection-feedback`,
    }),
    rateSkills: builder.mutation<any, { applicationId: number; ratings: any[] }>({
      query: (data) => ({
        url: '/candidates/rate-skills',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Applications', 'Profile'],
    }),
    updateProfile: builder.mutation<any, { fullName: string; phoneNumber: string }>({
      query: (data) => ({
        url: '/candidates/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profile'],
    }),
    applyJob: builder.mutation<any, { jobId: number }>({
      query: (data) => ({
        url: '/candidates/apply',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Applications', 'Applicants', 'Metrics'],
    }),
    updateCv: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/candidates/update-cv',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Profile', 'Applications'],
    }),
    upgradeCandidate: builder.mutation<any, void>({
      query: () => ({
        url: '/candidates/upgrade',
        method: 'POST',
      }),
      invalidatesTags: ['Profile'],
    }),
    addNote: builder.mutation<any, { id: number; note: string }>({
      query: ({ id, note }) => ({
        url: `/candidates/applicants/${id}/notes`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['ApplicantDetails'],
    }),
    updateStatus: builder.mutation<any, { id: number; status: string; notes?: string }>({
      query: ({ id, ...body }) => ({
        url: `/candidates/applicants/${id}/status`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Applicants', 'Scheduled', 'Metrics', 'ApplicantDetails'],
    }),
    matchResume: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/candidates/match-resume',
        method: 'POST',
        body: formData,
      }),
    }),
    optimizeResume: builder.mutation<any, { jobDescription: string; originalResumeText: string }>({
      query: (data) => ({
        url: '/candidates/optimize-resume',
        method: 'POST',
        body: data,
      }),
    }),
    deleteAccount: builder.mutation<any, void>({
      query: () => ({
        url: '/candidates/profile',
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCandidateApplicationsQuery,
  useGetCandidateProfileQuery,
  useGetApplicantsQuery,
  useGetApplicantDetailsQuery,
  useGetRejectionFeedbackQuery,
  useLazyGetRejectionFeedbackQuery,
  useRateSkillsMutation,
  useUpdateProfileMutation,
  useApplyJobMutation,
  useUpdateCvMutation,
  useUpgradeCandidateMutation,
  useAddNoteMutation,
  useUpdateStatusMutation,
  useMatchResumeMutation,
  useOptimizeResumeMutation,
  useDeleteAccountMutation,
} = candidatesApi;
