import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { test, describe } from 'vitest';
import { useCurrentCachedIQDataSlice, reshapeFFTs } from '@/api/iqdata/Queries';
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
      'core:label': 'first',
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

  test('Should only get tiles that have the same tile size', async ({ expect }) => {
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

describe("Check reshape array works correctly", () => {

  function createTestArray(fftSize, numLines) {
    const testArray = [];
    for (let i = 0; i < numLines; i++) {
      testArray[i] = new Float32Array(fftSize * 2).fill(i);
    }
    return testArray;
  }

  function flatten(a: Array<Float32Array>): number[] {
    return a.map(e => [...e]).flat();
  }

  test('Same size produces identical array', async ({ expect }) => {
    const fftSize = 128;
    const testArray = createTestArray(fftSize, 800);
    const newArray = reshapeFFTs(fftSize, testArray, fftSize);
    expect(newArray).toBe(testArray);
  });

  test('Reshape to larger fftSize', async ({ expect }) => {
    const fftSize = 128;
    const testArray = createTestArray(fftSize, 800);
    const newArray = reshapeFFTs(fftSize, testArray, fftSize * 2);
    console.log();
    expect(newArray).toHaveLength(testArray.length / 2);
    expect(flatten(newArray)).toEqual(flatten(testArray));
  });

  test('Reshape to smaller fftSize', async ({ expect }) => {
    const fftSize = 128;
    const testArray = createTestArray(fftSize, 800);
    const newArray = reshapeFFTs(fftSize, testArray, fftSize / 2);
    console.log();
    expect(newArray).toHaveLength(testArray.length * 2);
    expect(flatten(newArray)).toEqual(flatten(testArray));
  });

  test('Reshape to very different size', async ({ expect }) => {
    const fftSize = 16;
    const testArray = createTestArray(fftSize, 800);
    const newArray = reshapeFFTs(fftSize, testArray, 512);
    console.log();
    expect(newArray).toHaveLength(testArray.length * (fftSize/512));
    expect(flatten(newArray)).toEqual(flatten(testArray));
  });

  test('Reshape to non-integer-multiple size', async ({ expect }) => {
    const fftSize = 16;
    const testArray = createTestArray(fftSize, 800);
    console.log();
    expect(() => reshapeFFTs(fftSize, testArray, 30)).toThrow();
  });

  test.only('Copes with sparse arrays', async ({ expect }) => {
    const fftSize = 128;
    const testArray = createTestArray(fftSize, 800);

    for (let i = 0; i < testArray.length; i++) {
      // Remove every other line
      if (i % 2 == 1) {
        delete testArray[i];
      }
    }

    const newArray = reshapeFFTs(fftSize, testArray, 512);
    console.log();
    expect(newArray).toHaveLength(testArray.length * (fftSize/512));
    expect(newArray[0][0]).toEqual(testArray[0][0]);
    expect(newArray[0][fftSize]).toEqual(NaN);
    expect(newArray[0][2 * fftSize]).toEqual(testArray[2][0]);
  });
});
