import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import RepoBrowser from '@/Components/RepoBrowser/RepoBrowser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter as Router } from 'react-router-dom';
import connectionReducer from '@/Store/Reducers/ConnectionReducer';
import { Provider } from 'react-redux';
import { FeatureFlagsProvider } from '@/Components/FeatureFlagsContext/FeatureFlagsContext';

describe('Test RepoBrowser', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
  });

  const store = configureStore({
    reducer: {
      connection: connectionReducer,
      // other reducers go here
    },
  });

  const AllProviders = ({ children }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <FeatureFlagsProvider flags={null}>
          <Router>{children}</Router>
        </FeatureFlagsProvider>
      </QueryClientProvider>
    </Provider>
  );

  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  beforeAll(() => {
    import.meta.env.VITE_DETECTOR_ENDPOINT = 'http://127.0.0.1:8000/detectors/';
    import.meta.env.VITE_CONNECTION_INFO = '{}';
    import.meta.env.VITE_GOOGLE_ANALYTICS_KEY = 'UA-TEST-KEY-1';
    import.meta.env.VITE_FEATURE_FLAGS = { useAPIDatasources: true };
  });
  afterAll(() => {
    delete import.meta.env.VITE_DETECTOR_ENDPOINT;
    delete import.meta.env.VITE_CONNECTION_INFO;
    delete import.meta.env.VITE_GOOGLE_ANALYTICS_KEY;
    delete import.meta.env.VITE_FEATURE_FLAGS;
  });

  beforeEach(() => {
    queryClient.clear();
  });

  test('Basic Rendering', async () => {
    render(<RepoBrowser></RepoBrowser>, { wrapper: AllProviders });
    expect(await screen.getByText('Browse Your Azure Blob Storage')).exist;
  });
});

// test for rendering api datasources

// test for rendering azure blob storage
