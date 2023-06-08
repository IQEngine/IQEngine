import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import RepoBrowser from '@/Components/RepoBrowser/RepoBrowser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

describe("Test RepoBrowser", () => {

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
  });
  afterAll(() => {
    delete import.meta.env.VITE_DETECTOR_ENDPOINT;
    delete import.meta.env.VITE_CONNECTION_INFO;
    delete import.meta.env.VITE_GOOGLE_ANALYTICS_KEY;
  });

  beforeEach(() => {
    queryClient.clear();
  });

  test('Basic Rendering', async () => {
    render(<RepoBrowser></RepoBrowser>);
  });
});