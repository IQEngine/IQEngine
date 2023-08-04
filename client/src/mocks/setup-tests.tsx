// setupTests.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { FeatureFlagsProvider } from '@/hooks/use-feature-flags';
import { vi } from 'vitest';
import { Toaster } from 'react-hot-toast';
import { Annotation, CaptureSegment, SigMFMetadata } from '@/utils/sigmfMetadata';
import { ClientType } from '@/api/Models';

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

Object.defineProperty(window, 'loadPyodide', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    loadPackage: vi.fn(),
  })),
});

vi.mock('react-plotly.js', () => {
  return {
    default: vi.fn(),
  };
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      retry: false,
    },
  },
});

export function getValidMetadata(
  // 1 MHz sample rate
  sampleRate: number = 1024 * 1024,
  coreFrequency: number = 8486285000,
  type: string = ClientType.API,
  account: string = 'testaccount',
  container: string = 'testcontainer',
  filePath: string = 'test_file_path',
  dataType: string = 'cf32_le',
  // 128 seconds of data
  sampleLength = 1024 * 1024 * 128
): SigMFMetadata {
  let meta = {
    global: {
      'core:datatype': dataType,
      'core:sample_rate': sampleRate,
      'core:version': '0.0.2',
      'core:sha512':
        'bb2f1f9222b172373e81d333a11a866d56611308fd481c7f9c2462e50fec62da1bddd93a94cd9b3e00dcaa6ba4ffe4546022aa50385bc582fc8dd7426740b564',
      'core:description': '',
      'core:author': 'Marc',
      'core:recorder': 'GNU Radio 3.8.2',
      'core:license': 'https://creativecommons.org/licenses/by/4.0/',
      'traceability:revision': 1,
      'traceability:sample_length': sampleLength,
      'traceability:origin': {
        type: type,
        account: account,
        container: container,
        file_path: filePath,
      },
    },
    captures: [
      {
        'core:sample_start': 0,
        'core:frequency': coreFrequency,
        'core:datetime': '2020-12-20T17:32:07.142626',
      },
    ],
    annotations: [
      {
        'core:sample_start': 260780,
        'core:sample_count': 285354,
        'core:freq_lower_edge': 8486138750,
        'core:freq_upper_edge': 8486243700,
        'core:label': 'first',
      },
    ],
  };
  const metadata = Object.assign(new SigMFMetadata(), meta);
  metadata.annotations = meta.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
  metadata.captures = meta.captures.map((capture) => Object.assign(new CaptureSegment(), capture));
  return metadata;
}

export const AllProviders = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <FeatureFlagsProvider flags={null}>
      <Router>
        <Toaster />
        {children}
      </Router>
    </FeatureFlagsProvider>
  </QueryClientProvider>
);

export const useAllProviders = () => {
  return {
    wrapper: AllProviders,
    queryClient,
    getValidMetadata,
  };
};
