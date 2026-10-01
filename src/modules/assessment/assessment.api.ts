import { apiSlice } from '@/services/api/baseApi.js';

export const assessmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    startAssessment: builder.mutation<any, number>({
      query: (applicationId) => ({
        url: '/assessments/start',
        method: 'POST',
        body: { applicationId },
      }),
    }),
    getAssessmentQuestions: builder.query<{ questions: any[] }, number>({
      query: (assessmentId) => `/assessments/${assessmentId}/questions`,
    }),
    saveAnswer: builder.mutation<any, { assessmentId: number; questionId: number; selectedOption: string; timeSpent?: number }>({
      query: (data) => ({
        url: '/assessments/save-answer',
        method: 'POST',
        body: data,
      }),
    }),
    submitAssessment: builder.mutation<any, { assessmentId: number }>({
      query: (data) => ({
        url: '/assessments/submit',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Applications'],
    }),
    getCandidateTests: builder.query<{ tests: any[] }, void>({
      query: () => '/assessments/candidate/tests',
      providesTags: ['Applications'],
    }),
    getTestReport: builder.query<any, number>({
      query: (applicationId) => `/assessments/report/${applicationId}`,
    }),
    getAdminTests: builder.query<{ tests: any[] }, Record<string, string>>({
      query: (params) => ({
        url: '/assessments/admin/tests',
        params,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useStartAssessmentMutation,
  useGetAssessmentQuestionsQuery,
  useLazyGetAssessmentQuestionsQuery,
  useSaveAnswerMutation,
  useSubmitAssessmentMutation,
  useGetCandidateTestsQuery,
  useGetTestReportQuery,
  useGetAdminTestsQuery,
} = assessmentApi;

