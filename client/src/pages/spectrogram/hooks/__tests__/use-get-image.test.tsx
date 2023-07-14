import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { test, describe } from 'vitest';
import { useGetImage } from '../use-get-image';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { TILE_SIZE_IN_IQ_SAMPLES, COLORMAP_DEFAULT } from '@/utils/constants';
import React from 'react';

const type = 'blob';
const account = 'gnuradio';
const container = 'iqengine';
const filePath = 'bluetooth';
const fftSize = 1024;
const magnitudeMin = -10.0;
const magnitudeMax = -40.0;
const totalFftData = new Float32Array(7 * TILE_SIZE_IN_IQ_SAMPLES);
totalFftData[0] = Number.NEGATIVE_INFINITY;

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
    'traceability:sample_length': 131072000,
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
  test('useGetImage fftToRGB white box', async ({ expect }) => {
    const queryClient = new QueryClient();
    queryClient.defaultQueryOptions({ staleTime: Infinity });
    const recording = Object.assign(new SigMFMetadata(), baseMetadataFile);
    queryClient.setQueryData(['datasource', type, account, container, filePath, 'meta'], recording);
    queryClient.setQueryData(['user-settings', 'local-files'], 'files');
    queryClient.setQueryData(['user-settings', 'blob-data-sources'], 'dataSources');
    const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result } = renderHook(
      () => useGetImage(totalFftData, fftSize, magnitudeMin, magnitudeMax, COLORMAP_DEFAULT),
      { wrapper }
    );

    expect(result.current.image).toEqual([]);
  });
});
