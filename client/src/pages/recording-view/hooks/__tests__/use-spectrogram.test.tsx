import { useAllProviders, AllProviders } from '@/mocks/setup-tests';
import { renderHook, waitFor } from '@testing-library/react';
import nock from 'nock';
import { useSpectrogram } from '@/pages/recording-view/hooks/use-spectrogram';
import { act } from 'react-dom/test-utils';
import { SpectrogramContextProvider } from '@/pages/recording-view/hooks/use-spectrogram-context';
import React from 'react';
import { TraceabilityOrigin } from '@/utils/sigmfMetadata';

function getDefaultSeedValues() {
  return {
    spectrogramWidth: 1024,
    magnitudeMin: 0,
    magnitudeMax: 100,
    colmap: 'viridis',
    windowFunction: 'hann',
    fftSize: 1024,
    spectrogramHeight: 800,
    fftStepSize: 0,
  };
}

function createTestWrapper(
  origin: TraceabilityOrigin,
  seed: {
    spectrogramWidth: number;
    magnitudeMin: number;
    magnitudeMax: number;
    colmap: string;
    windowFunction: string;
    fftSize: number;
    spectrogramHeight: number;
    fftStepSize: number;
  },
  children: React.ReactElement<any, string | React.JSXElementConstructor<any>>
): React.ReactNode {
  return (
    <AllProviders>
      <SpectrogramContextProvider
        type={origin.type}
        account={origin.account}
        container={origin.container}
        filePath={origin.file_path}
        seedValues={seed}
      >
        {children}
      </SpectrogramContextProvider>
    </AllProviders>
  );
}

describe('test metadata fetch and fft calculation', () => {
  beforeEach(() => {
    nock('http://localhost:3000').get('/api/config').reply(200, {
      uploadPageBlobSasUrl: 'NOT A VALID SAS URL',
      internalBranding: false,
    });
  });

  afterEach(() => {
    nock.cleanAll();
    const { queryClient } = useAllProviders();
    queryClient.clear();
  });
  test('should calculate the right number of ffts', async () => {
    const { getValidMetadata } = useAllProviders();
    const metadata = getValidMetadata();
    const fftSize = 1024;
    const total_ffts = 128;
    metadata.global['traceability:sample_length'] = fftSize * total_ffts;
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, metadata);
    const origin = metadata.getOrigin();
    const seed = getDefaultSeedValues();
    seed.fftSize = fftSize;

    const { result } = renderHook(() => useSpectrogram(0), {
      wrapper: ({ children }) => createTestWrapper(origin, seed, children),
    });
    await waitFor(() => expect(result.current.totalFFTs).toBe(total_ffts));
  });

  test('should calculate the correct iqs that need to be displayed', async () => {
    const { getValidMetadata } = useAllProviders();
    const metadata = getValidMetadata();
    const fftSize = 1024;
    const total_ffts = 128;
    metadata.global['traceability:sample_length'] = fftSize * total_ffts;
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, metadata);
    const origin = metadata.getOrigin();
    const seed = getDefaultSeedValues();
    seed.fftSize = fftSize;
    seed.spectrogramHeight = 10;
    const { result } = renderHook(() => useSpectrogram(0), {
      wrapper: ({ children }) => createTestWrapper(origin, seed, children),
    });

    await waitFor(() => expect(result.current.fftsRequired.length).toBe(10));
    expect(result.current.fftsRequired).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('should calculate the correct ffts that need to be displayed when decimating', async () => {
    const { getValidMetadata } = useAllProviders();
    const metadata = getValidMetadata();
    const fftSize = 1024;
    const total_ffts = 128;
    metadata.global['traceability:sample_length'] = fftSize * total_ffts;
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, metadata);
    const origin = metadata.getOrigin();
    const seed = getDefaultSeedValues();
    seed.fftSize = fftSize;
    seed.spectrogramHeight = 10;
    seed.fftStepSize = 1;
    const { result } = renderHook(() => useSpectrogram(0), {
      wrapper: ({ children }) => createTestWrapper(origin, seed, children),
    });

    await waitFor(() => expect(result.current.fftsRequired.length).toBe(10));
    expect(result.current.fftsRequired).toStrictEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);

    act(() => {
      result.current.setFFTStepSize(2);
    });

    await waitFor(() => expect(result.current.fftsRequired.length).toBe(10));
    expect(result.current.fftsRequired).toStrictEqual([0, 3, 6, 9, 12, 15, 18, 21, 24, 27]);
  });

  test('should calculate the correct ffts that need to be displayed when decimating and changing height', async () => {
    const { getValidMetadata } = useAllProviders();
    const metadata = getValidMetadata();
    const fftSize = 1024;
    const total_ffts = 128;
    metadata.global['traceability:sample_length'] = fftSize * total_ffts;
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, metadata);
    const origin = metadata.getOrigin();
    const seed = getDefaultSeedValues();
    seed.fftSize = fftSize;
    seed.spectrogramHeight = 10;
    seed.fftStepSize = 1;
    const { result } = renderHook(() => useSpectrogram(0), {
      wrapper: ({ children }) => createTestWrapper(origin, seed, children),
    });

    await waitFor(() => expect(result.current.fftsRequired.length).toBe(10));
    expect(result.current.fftsRequired).toStrictEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);

    act(() => {
      result.current.setFFTStepSize(2);
      result.current.setSpectrogramHeight(5);
    });

    await waitFor(() => expect(result.current.fftsRequired.length).toBe(5));
    expect(result.current.fftsRequired).toStrictEqual([0, 3, 6, 9, 12]);
  });
});
