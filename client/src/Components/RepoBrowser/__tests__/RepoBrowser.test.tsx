import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import RepoBrowser from '@/Components/RepoBrowser/RepoBrowser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import nock from 'nock';
import '@testing-library/jest-dom';

import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter as Router } from 'react-router-dom';
import connectionReducer from '@/Store/Reducers/ConnectionReducer';
import { Provider } from 'react-redux';
import { FeatureFlagsProvider } from '@/Components/FeatureFlagsContext/FeatureFlagsContext';
import { DataSource } from '@/api/Models';

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
    expect(screen.getByText('Browse Your Azure Blob Storage')).exist;
  });

  test('Display Repository API Tile', async () => {
    const data: DataSource[] = [
      {
        type: 'API',
        name: 'api-test-name',
        account: 'api-test-account',
        container: 'api-test-container',
        description: 'API Test Description',
      }
    ];
    nock('http://localhost:3000').get('/api/datasources').reply(200, data);
    
    render(<RepoBrowser/>, { wrapper: AllProviders });
    expect(await screen.findByRole('button', { name: 'api-test-name' })).toBeInTheDocument();
    expect(await screen.findByText('API Test Description')).toBeInTheDocument();
  });

  test('Displays All Repository API Tiles', async () => {
    const data: DataSource[] = [
      {
        type: 'API',
        name: 'api-test-name',
        account: 'api-test-account',
        container: 'api-test-container',
        description: 'API Test Description',
      },
      {
        type: 'API',
        name: 'api-test-name2',
        account: 'api-test-account2',
        container: 'api-test-container2',
        description: 'API Test Description 2',
      }
    ];
    nock('http://localhost:3000').get('/api/datasources').reply(200, data);
    
    render(<RepoBrowser/>, { wrapper: AllProviders });
    expect(await screen.findByRole('button', { name: 'api-test-name' })).toBeInTheDocument();
    expect(await screen.findByText('API Test Description')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'api-test-name2' })).toBeInTheDocument();
    expect(await screen.findByText('API Test Description 2')).toBeInTheDocument();
  });


});

// test for rendering api datasources

// test for rendering azure blob storage
