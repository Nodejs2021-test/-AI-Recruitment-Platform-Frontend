import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer.js';
import { getMiddleware } from './middleware.js';

export const store = configureStore({
  reducer: rootReducer,
  middleware: getMiddleware,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
