import { apiSlice } from '@/services/api/baseApi.js';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    changePassword: builder.mutation<any, { newPassword: string }>({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useChangePasswordMutation,
} = authApi;
