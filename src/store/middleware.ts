import { apiSlice } from '@/services/api/baseApi.js';

export const getMiddleware = (getDefaultMiddleware: any) =>
  getDefaultMiddleware().concat(apiSlice.middleware);
