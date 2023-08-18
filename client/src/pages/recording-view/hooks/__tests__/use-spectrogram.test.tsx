import { useAllProviders, AllProviders } from '@/mocks/setup-tests';
import { renderHook, waitFor } from '@testing-library/react';
import nock from 'nock';
import { useSpectrogram } from '@/pages/recording-view/hooks/use-spectrogram';
import { act } from 'react-dom/test-utils';
import { SpectrogramContextProvider } from '@/pages/recording-view/hooks/use-spectrogram-context';
import React from 'react';
import { TraceabilityOrigin } from '@/utils/sigmfMetadata';
import { FETCH_PADDING } from '@/utils/constants';

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
    const total_ffts = 256;
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

    await waitFor(() => expect(result.current.minimapFFTIndices.length).toBe(10 + FETCH_PADDING));
    const expected = Array(10 + FETCH_PADDING)
      .fill(0)
      .map((_, i) => i);
    expect(result.current.minimapFFTIndices).toStrictEqual(expected);
  });

  test('should calculate the correct ffts that need to be displayed when decimating', async () => {
    const { getValidMetadata } = useAllProviders();
    const metadata = getValidMetadata();
    const fftSize = 1024;
    const total_ffts = 512;
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

    await waitFor(() => expect(result.current.minimapFFTIndices.length).toBe(10 + FETCH_PADDING));
    let expected = Array(10 + FETCH_PADDING)
      .fill(0)
      .map((_, i) => i * 2);
    expect(result.current.minimapFFTIndices).toStrictEqual(expected);

    act(() => {
      result.current.setFFTStepSize(2);
    });

    await waitFor(() => expect(result.current.minimapFFTIndices.length).toBe(10 + FETCH_PADDING));
    expected = Array(10 + FETCH_PADDING)
      .fill(0)
      .map((_, i) => i * 3);
    expect(result.current.minimapFFTIndices).toStrictEqual(expected);
  });

  test('should calculate the correct ffts that need to be displayed when decimating and changing height', async () => {
    const { getValidMetadata } = useAllProviders();
    const metadata = getValidMetadata();
    const fftSize = 1024;
    const total_ffts = 512;
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
    let expected = Array(10 + FETCH_PADDING)
      .fill(0)
      .map((_, i) => i * 2);
    await waitFor(() => expect(result.current.minimapFFTIndices.length).toBe(10 + FETCH_PADDING));
    expect(result.current.minimapFFTIndices).toStrictEqual(expected);

    act(() => {
      result.current.setFFTStepSize(2);
      result.current.setSpectrogramHeight(5);
    });

    await waitFor(() => expect(result.current.minimapFFTIndices.length).toBe(5 + FETCH_PADDING));

    expected = Array(5 + FETCH_PADDING)
      .fill(0)
      .map((_, i) => i * 3);
    expect(result.current.minimapFFTIndices).toStrictEqual(expected);
  });
});
