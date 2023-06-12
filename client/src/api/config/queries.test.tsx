import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { configQuery } from './queries';

import nock from 'nock';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

describe('Config contains information from environment', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
  });
  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  beforeAll(() => {
    import.meta.env.VITE_DETECTOR_ENDPOINT = 'http://127.0.0.1:8000/detectors/';
    import.meta.env.VITE_CONNECTION_INFO = '{}';
    import.meta.env.VITE_GOOGLE_ANALYTICS_KEY = 'UA-TEST-KEY-1';
    import.meta.env.VITE_FEATURE_FLAGS = '{}';
  });
  afterAll(() => {
    delete import.meta.env.VITE_DETECTOR_ENDPOINT;
    delete import.meta.env.VITE_CONNECTION_INFO;
    delete import.meta.env.VITE_GOOGLE_ANALYTICS_KEY;
    delete import.meta.env.VITE_FEATURE_FLAGS;
  });

  beforeEach(() => {
    nock.cleanAll();
    queryClient.clear();
  });

  test('config can get information from environment variable', async () => {
    // Arrange
    nock('http://localhost:3000').get('/api/config').reply(200, {});
    // Act
    const { result } = renderHook(() => configQuery(), { wrapper });
    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data.detectorEndpoint).toBe('http://127.0.0.1:8000/detectors/');
      expect(result.current.data.connectionInfo).toMatchObject({});
      expect(result.current.data.googleAnalyticsKey).toBe('UA-TEST-KEY-1');
      expect(result.current.data.featureFlags).toMatchObject({});
    });
  });

  test('config can get information from environment variable incase the api dies', async () => {
    // Assert
    nock('http://localhost:3000').get('/api/config').reply(500, {});

    // Act
    const { result } = renderHook(() => configQuery(), { wrapper });
    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data.detectorEndpoint).toBe('http://127.0.0.1:8000/detectors/');
      expect(result.current.data.connectionInfo).toMatchObject({});
      expect(result.current.data.googleAnalyticsKey).toBe('UA-TEST-KEY-1');
      expect(result.current.data.featureFlags).toMatchObject({});
    });
  });

  test('config from env it is overridden by result from API', async () => {
    // Arrange
    nock('http://localhost:3000')
      .get('/api/config')
      .reply(200, {
        detectorEndpoint: 'http://some-detector-endpoint',
        connectionInfo: { some: 'connection-info' },
        googleAnalyticsKey: 'UA-SOME_KEY-1',
        featureFlags: { someFeature: true },
      });
    // Act
    const { result } = renderHook(() => configQuery(), { wrapper });
    // Assert
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data.detectorEndpoint).toBe('http://some-detector-endpoint');
      expect(result.current.data.connectionInfo).toMatchObject({ some: 'connection-info' });
      expect(result.current.data.googleAnalyticsKey).toBe('UA-SOME_KEY-1');
      expect(result.current.data.featureFlags).toMatchObject({});
    });
  });
});
