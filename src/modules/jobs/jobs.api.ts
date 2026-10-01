import { apiSlice } from '@/services/api/baseApi.js';

export const jobsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query<any[], any>({
      query: (params) => ({
        url: '/jobs',
        params,
      }),
      providesTags: ['Jobs'],
    }),
    updateJob: builder.mutation<any, { id: number; title: string; department: string; location: string; type: string; salaryRange: string; description: string; requirements: string[]; status: string }>({
      query: ({ id, ...body }) => ({
        url: `/jobs/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Jobs'],
    }),
    createJob: builder.mutation<any, { title: string; department: string; location: string; type: string; salaryRange: string; description: string; requirements: string[]; status: string }>({
      query: (data) => ({
        url: '/jobs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Jobs', 'Metrics'],
    }),
    deleteJob: builder.mutation<any, number>({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Jobs', 'Metrics'],
    }),
    parseJd: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/jobs/parse-jd',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetJobsQuery,
  useUpdateJobMutation,
  useCreateJobMutation,
  useDeleteJobMutation,
  useParseJdMutation,
} = jobsApi;
