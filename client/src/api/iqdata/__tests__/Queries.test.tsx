import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { test, describe } from 'vitest';
import { useCurrentCachedIQDataSlice } from '@/api/iqdata/Queries';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const account = 'local';
const container = 'local';
const filePath = 'my_recording';
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
    'traceability:sample_length': 128,
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
};

describe('Check if query cache works correctly ', () => {
  test('Nothing on the cache should return empty arrray', async ({ expect }) => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    let metadata = Object.assign(new SigMFMetadata(), baseMetadataFile);
    const { result } = renderHook(() => useCurrentCachedIQDataSlice(metadata), { wrapper });
    console.log();
    expect(result.current).toStrictEqual({
      downloadedTiles: [],
    });
  });
  test('If there is one downloaded tiles should have one', async ({ expect }) => {
    const queryClient = new QueryClient();
    let metadata = Object.assign(new SigMFMetadata(), baseMetadataFile);
    const { type } = metadata.getOrigin();
    queryClient.setQueryData(['datasource', type, account, container, filePath, 'iq', { index: 1, tileSize: 1 }], {});
    const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

    const { result } = renderHook(() => useCurrentCachedIQDataSlice(metadata, 1), { wrapper });
    console.log();
    expect(result.current).toStrictEqual({
      downloadedTiles: [1],
    });
  });

  test('If there is multiple downloaded tiles should have multiple in the array', async ({ expect }) => {
    const queryClient = new QueryClient();
    let metadata = Object.assign(new SigMFMetadata(), baseMetadataFile);
    const { type } = metadata.getOrigin();
    queryClient.setQueryData(['datasource', type, account, container, filePath, 'iq', { index: 1, tileSize: 1 }], {});
    queryClient.setQueryData(['datasource', type, account, container, filePath, 'iq', { index: 5, tileSize: 1 }], {});
    queryClient.setQueryData(['datasource', type, account, container, filePath, 'iq', { index: 10, tileSize: 1 }], {});
    const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

    const { result } = renderHook(() => useCurrentCachedIQDataSlice(metadata, 1), { wrapper });
    console.log();
    expect(result.current).toStrictEqual({
      downloadedTiles: [1, 5, 10],
    });
  });

  test('Shouwl only get tiles that have the same tile size', async ({ expect }) => {
    const queryClient = new QueryClient();
    let metadata = Object.assign(new SigMFMetadata(), baseMetadataFile);
    const { type } = metadata.getOrigin();
    queryClient.setQueryData(['datasource', type, account, container, filePath, 'iq', { index: 1, tileSize: 1 }], {});
    queryClient.setQueryData(['datasource', type, account, container, filePath, 'iq', { index: 5, tileSize: 1 }], {});
    queryClient.setQueryData(['datasource', type, account, container, filePath, 'iq', { index: 10, tileSize: 1 }], {});
    queryClient.setQueryData(['datasource', type, account, container, filePath, 'iq', { index: 15, tileSize: 2 }], {});
    const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

    const { result } = renderHook(() => useCurrentCachedIQDataSlice(metadata, 1), { wrapper });
    console.log();
    expect(result.current).toStrictEqual({
      downloadedTiles: [1, 5, 10],
    });
  });
});
