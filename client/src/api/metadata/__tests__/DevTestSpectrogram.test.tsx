import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { test, describe, vi } from 'vitest';
import { useGetImage } from '../DevTestSpectrogram';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';

const type = 'blob';
const account = 'gnuradio';
const container = 'iqengine';
const filePath = 'bluetooth';
const fftSize = 1024;
const handleTop = 0;
const zoomLevel = 1;
const spectrogramHeight = 800;

const baseMetadataFile = {
  global: {
    'core:datatype': 'cf32_le',
    'core:sample_rate': 480000,
    'core:version': '0.0.2',
    'core:sha512':
      'bb2f1f9222b172373e81d333a11a866d56611308fd481c7f9c2462e50fec62da1bddd93a94cd9b3e00dcaa6ba4ffe4546022aa50385bc582fc8dd7426740b564',
    'core:description': '',
    'core:author': 'Marc',
    'core:recorder': 'GNU Radio 3.8.2',
    'core:license': 'https://creativecommons.org/licenses/by/4.0/',
    'traceability:sample_length': 400000000,
    'traceability:origin': {
      type: 'local',
      account: account,
      container: container,
      file_path: filePath,
    },
  },
  captures: [
    {
      'core:sample_start': 0,
      'core:frequency': 8486285000,
      'core:datetime': '2020-12-20T17:32:07.142626',
    },
  ],
  annotations: [
    {
      'core:sample_start': 260780,
      'core:sample_count': 285354,
      'core:freq_lower_edge': 8486138750,
      'core:freq_upper_edge': 8486243700,
      'core:description': 'first',
    },
  ],
  dataFileHandle: {
    name: 'my_recording.sigmf-data',
    text: () => Promise.resolve(''),
    webkitRelativePath: '',
    size: 1024,
  },
  metadataFileHandle: {
    name: 'my_recording.sigmf-meta',
    text: () => Promise.resolve(''),
    webkitRelativePath: '',
    size: 1024,
  },
};

describe('DevTest Spectrogram Tests', () => {
  test('useGetImage should return tiles 0123456', async ({ expect }) => {
    const queryClient = new QueryClient();
    queryClient.defaultQueryOptions({ staleTime: Infinity });
    const recording = Object.assign(new SigMFMetadata(), baseMetadataFile);
    queryClient.setQueryData(['datasource', type, account, container, filePath, 'meta'], recording);
    queryClient.setQueryData(['user-settings', 'local-files'], 'files');
    queryClient.setQueryData(['user-settings', 'blob-data-sources'], 'dataSources');
    const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result } = renderHook(
      () => useGetImage(type, account, container, filePath, fftSize, handleTop, zoomLevel, spectrogramHeight),
      { wrapper }
    );

    expect(result.current.tiles).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  test('useGetImage should return tiles 1234567', async ({ expect }) => {
    const queryClient = new QueryClient();
    queryClient.defaultQueryOptions({ staleTime: Infinity });
    const recording = Object.assign(new SigMFMetadata(), baseMetadataFile);
    queryClient.setQueryData(['datasource', type, account, container, filePath, 'meta'], recording);
    queryClient.setQueryData(['user-settings', 'local-files'], 'files');
    queryClient.setQueryData(['user-settings', 'blob-data-sources'], 'dataSources');
    const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useGetImage(type, account, container, filePath, fftSize, 0, zoomLevel, 128), {
      wrapper,
    });

    expect(result.current.tiles).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
