import { combineReducers } from '@reduxjs/toolkit';
import { apiSlice } from '@/services/api/baseApi.js';

export const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
});
