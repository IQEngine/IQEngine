// setupTests.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { FeatureFlagsProvider } from '@/Components/FeatureFlagsContext/FeatureFlagsContext';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});

export const store = configureStore({
  reducer: {},
});

export const AllProviders = ({ children }) => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <FeatureFlagsProvider flags={null}>
        <Router>{children}</Router>
      </FeatureFlagsProvider>
    </QueryClientProvider>
  </Provider>
);
