import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { API_URL } from '@/app/providers/AuthProvider.js';


const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    const url = typeof args === 'string' ? args : args.url;
    if (!url.includes('/auth/refresh') && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      const rToken = localStorage.getItem('refresh_token');
      if (rToken) {
        try {
          const refreshResult = await rawBaseQuery(
            {
              url: '/auth/refresh',
              method: 'POST',
              body: { refreshToken: rToken },
            },
            api,
            extraOptions
          );

          if (refreshResult.data) {
            const { accessToken: newAccessToken } = refreshResult.data as any;
            localStorage.setItem('access_token', newAccessToken);

            result = await rawBaseQuery(args, api, extraOptions);
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_data');
            window.location.href = '/login-register';
          }
        } catch (err) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
          window.location.href = '/login-register';
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login-register';
      }
    }
  }
  return result;
};
