// setupTests.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { FeatureFlagsProvider } from '@/hooks/useFeatureFlags';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      retry: false,
    },
  },
});



export const AllProviders = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagsProvider flags={null}>
        <Router>{children}</Router>
      </FeatureFlagsProvider>
    </QueryClientProvider>
);

export const useAllProviders = () => {
  return {
    wrapper: AllProviders,
    queryClient
  };
};
