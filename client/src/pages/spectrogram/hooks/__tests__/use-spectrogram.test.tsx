import { useAllProviders } from '@/mocks/setup-tests';
import { renderHook, waitFor } from '@testing-library/react';
import nock from 'nock';
import { useSpectrogram } from '@/pages/spectrogram/hooks/use-spectrogram';
import { act } from 'react-dom/test-utils';

describe('test metadata fetch and fft calculation', () => {
  beforeEach(() => {
    nock('http://localhost:3000').get('/api/config').reply(200, {
      uploadPageBlobSasUrl: 'NOT A VALID SAS URL',
    });
  });

  afterEach(() => {
    nock.cleanAll();
    const { queryClient } = useAllProviders();
    queryClient.clear();
  });
  test('should calculate the right number of ffts', async () => {
    const { wrapper, getValidMetadata } = useAllProviders();
    const metadata = getValidMetadata();
    const fftSize = 1024;
    const total_ffts = 128;
    metadata.global['traceability:sample_length'] = fftSize * total_ffts;
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, metadata);
    const origin = metadata.getOrigin();

    const { result } = renderHook(
      () =>
        useSpectrogram({
          fftSize: fftSize,
          type: origin.type,
          account: origin.account,
          container: origin.container,
          filePath: origin.file_path,
        }),
      {
        wrapper: wrapper,
      }
    );
    await waitFor(() => expect(result.current.total_ffts).toBe(total_ffts));
  });

  test('should calculate the correct ffts thhat need to be displayed', async () => {
    const { wrapper, getValidMetadata } = useAllProviders();
    const metadata = getValidMetadata();
    const fftSize = 1024;
    const total_ffts = 128;
    metadata.global['traceability:sample_length'] = fftSize * total_ffts;
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, metadata);
    const origin = metadata.getOrigin();
    const { result } = renderHook(
      () =>
        useSpectrogram({
          fftSize: fftSize,
          type: origin.type,
          account: origin.account,
          container: origin.container,
          filePath: origin.file_path,
        }),
      {
        wrapper: wrapper,
      }
    );
    act(() => {
      result.current.setSpectrogramHeight(10);
    });

    await waitFor(() => expect(result.current.displayedFFTs.length).toBe(10));
    expect(result.current.displayedFFTs).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('should calculate the correct ffts that need to be displayed when decimating', async () => {
    const { wrapper, getValidMetadata } = useAllProviders();
    const metadata = getValidMetadata();
    const fftSize = 1024;
    const total_ffts = 128;
    metadata.global['traceability:sample_length'] = fftSize * total_ffts;
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, metadata);
    const origin = metadata.getOrigin();
    const { result } = renderHook(
      () =>
        useSpectrogram({
          fftSize: fftSize,
          type: origin.type,
          account: origin.account,
          container: origin.container,
          filePath: origin.file_path,
        }),
      {
        wrapper: wrapper,
      }
    );
    act(() => {
      result.current.setSpectrogramHeight(10);
      result.current.setFFTStepSize(1);
    });

    await waitFor(() => expect(result.current.displayedFFTs.length).toBe(10));
    expect(result.current.displayedFFTs).toStrictEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);

    act(() => {
      result.current.setFFTStepSize(2);
    });

    await waitFor(() => expect(result.current.displayedFFTs.length).toBe(10));
    expect(result.current.displayedFFTs).toStrictEqual([0, 3, 6, 9, 12, 15, 18, 21, 24, 27]);
  });

  test('should calculate the correct ffts that need to be displayed when decimating and changing height', async () => {
    const { wrapper, getValidMetadata } = useAllProviders();
    const metadata = getValidMetadata();
    const fftSize = 1024;
    const total_ffts = 128;
    metadata.global['traceability:sample_length'] = fftSize * total_ffts;
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, metadata);
    const origin = metadata.getOrigin();
    const { result } = renderHook(
      () =>
        useSpectrogram({
          fftSize: fftSize,
          type: origin.type,
          account: origin.account,
          container: origin.container,
          filePath: origin.file_path,
        }),
      {
        wrapper: wrapper,
      }
    );
    act(() => {
      result.current.setSpectrogramHeight(10);
      result.current.setFFTStepSize(1);
    });

    await waitFor(() => expect(result.current.displayedFFTs.length).toBe(10));
    expect(result.current.displayedFFTs).toStrictEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);

    act(() => {
      result.current.setFFTStepSize(2);
      result.current.setSpectrogramHeight(5);
    });

    await waitFor(() => expect(result.current.displayedFFTs.length).toBe(5));
    expect(result.current.displayedFFTs).toStrictEqual([0, 3, 6, 9, 12]);
  });
});
