import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/index.js';

export const ReduxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};
