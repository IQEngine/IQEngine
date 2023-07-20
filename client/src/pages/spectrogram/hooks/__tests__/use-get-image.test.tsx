import { test, describe } from 'vitest';
import { useGetImage } from '../use-get-image';
import { renderHook, waitFor } from '@testing-library/react';
import { TILE_SIZE_IN_IQ_SAMPLES as tilesize, COLORMAP_DEFAULT } from '@/utils/constants';
import { SampleType, generateSampleRecording, normalizeMagnitude } from '@/utils/testFunctions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

describe('DevTest Spectrogram Tests', () => {
  //template test.each([[], []])('test', async () => {});
  test.each([['first', tilesize, 1024, -40.0, -10.0, 'jet', 'hamming']])(
    'test',
    async (comment, tile_size, fftSize, magnitudeMin, magnitudeMax, colorMap, windowFunction) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
          },
        },
      });
      const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

      const spectrogramHeight = tile_size / fftSize;
      const iqData = new Float32Array(tile_size);
      queryClient.setQueryData(['iqdata'], iqData);

      // run the code-under-test
      const { result } = renderHook(
        () => useGetImage(fftSize, spectrogramHeight, magnitudeMin, magnitudeMax, colorMap, windowFunction),
        {
          wrapper,
        }
      );
      await waitFor(() => {
        expect(result.current.image).not.toBeNull();
      });
    }
  );

  test.each([
    [-40, -40, -10, 0],
    [-10, -40, -10, 255],
    [-25, -40, -10, 127.5],
    [-40, -30, -20, 0],
    [-20, -30, -20, 255],
    [-25, -30, -20, 127.5],
    [-40, -50, 50, 25.5],
    [0, -50, 50, 127.5],
    [10, -50, 50, 153],
  ])(
    'test the normalizeMagnitude function',
    async (magnitude_in_db, magnitudeMin, magnitudeMax, normalized_magnitude) => {
      const test_value = normalizeMagnitude(magnitude_in_db, magnitudeMin, magnitudeMax);

      // this is to eliminate rounding errors
      const diff = Math.abs(test_value - normalized_magnitude);
      expect(diff).toBeLessThan(0.000001);
    }
  );

  test.each([
    ['min=NaN', tilesize, 128, NaN, 10.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    ['max=Nan', tilesize, 128, -10.0, NaN, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    ['min>max', tilesize, 256, -20.0, -30.0, 'jet', SampleType.MultipleBuckets],
    ['min==max', tilesize, 512, -60.0, -60.0, 'plasma', SampleType.MultipleBuckets],
    ['fftSize==0', tilesize, 0, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],

    ['min=NaN', tilesize, 128, NaN, 10.0, COLORMAP_DEFAULT, SampleType.WhiteBox],
    ['max=Nan', tilesize, 128, -10.0, NaN, COLORMAP_DEFAULT, SampleType.WhiteBox],
    ['min>max', tilesize, 256, -20.0, -30.0, 'jet', SampleType.WhiteBox],
    ['min==max', tilesize, 512, -60.0, -60.0, 'plasma', SampleType.WhiteBox],
    ['fftSize==0', tilesize, 0, -40.0, -10.0, 'jet', SampleType.WhiteBox],
  ])('Failing test: %s', async (comment, tile_size, fftSize, magnitudeMin, magnitudeMax, colorMap, sampleType) => {
    const { sampleRecording } = generateSampleRecording(
      tile_size,
      fftSize,
      sampleType,
      magnitudeMin,
      magnitudeMax,
      colorMap
    );
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
        },
      },
    });
    const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    queryClient.setQueryData(['fftdata'], sampleRecording);

    const spectrogramHeight = tile_size / (fftSize == 0 ? 1024 : fftSize);

    // run the code-under-test
    const { result } = renderHook(
      () => useGetImage(fftSize, spectrogramHeight, magnitudeMin, magnitudeMax, colorMap, 'hamming'),
      {
        wrapper,
      }
    );
    await waitFor(() => {
      expect(result.current.image).toBeNull();
    });
  });

  test.each([
    ['128,multi-dB', tilesize, 128, -40.0, 0.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    ['256,multi-dB', tilesize, 256, -30.0, -20.0, 'jet', SampleType.MultipleBuckets],
    ['512,multi-dB', tilesize, 512, -60.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    ['defaults,multi-dB', tilesize, 1024, -40.0, -10.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    ['defaults,jet,multi-dB', tilesize, 1024, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    ['2048,jet,multi-dB', tilesize, 2048, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    ['-80/0,plasma,multi-dB', tilesize, 1024, -80.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    ['4096,-20/20,multi-dB', tilesize, 4096, -20.0, 20.0, 'plasma', SampleType.MultipleBuckets],
    ['8192,-60/50,inferno,multi-dB', tilesize, 8192, -60.0, 50.0, 'inferno', SampleType.MultipleBuckets],
    ['16384,-100/50,multi-dB', tilesize, 16384, -100.0, 50.0, 'inferno', SampleType.MultipleBuckets],

    ['128,white box', tilesize, 128, -40.0, 0.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    ['256,white box', tilesize, 256, -30.0, -20.0, 'jet', SampleType.MultipleBuckets],
    ['512,white box', tilesize, 512, -60.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    ['defaults,white box', tilesize, 1024, -40.0, -10.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    ['defaults,jet,white box', tilesize, 1024, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    ['2048,jet,white box', tilesize, 2048, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    ['-80/0,plasma,white box', tilesize, 1024, -80.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    ['4096,-20/20,white box', tilesize, 4096, -20.0, 20.0, 'plasma', SampleType.MultipleBuckets],
    ['8192,-60/50,inferno,white box', tilesize, 8192, -60.0, 50.0, 'inferno', SampleType.MultipleBuckets],
    ['16384,-100/50,white box', tilesize, 16384, -100.0, 50.0, 'inferno', SampleType.MultipleBuckets],
  ])('Passing test: %s', async (comment, tile_size, fftSize, magnitudeMin, magnitudeMax, colorMap, sampleType) => {
    const { sampleRecording, num_ffts, expectedImageData } = generateSampleRecording(
      tile_size,
      fftSize,
      sampleType,
      magnitudeMin,
      magnitudeMax,
      colorMap
    );
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
        },
      },
    });
    const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    queryClient.setQueryData(['fftdata'], sampleRecording);

    const spectrogramHeight = tile_size / (fftSize == 0 ? 1024 : fftSize);

    // run the code-under-test
    const { result } = renderHook(
      () => useGetImage(fftSize, spectrogramHeight, magnitudeMin, magnitudeMax, colorMap, 'hamming'),
      {
        wrapper,
      }
    );
    await waitFor(() => {
      expect(result.current.image).not.toBeNull();
    });

    // get the ImageData of the code-under-test ImageBitmap
    const lastCall = createImageBitmap.mock.lastCall;
    const imageDataCalled = lastCall[0];

    // code-under-test should generate an image of the same height and width
    expect(result.current.image.width).toEqual(fftSize);
    expect(result.current.image.height).toEqual(num_ffts);

    // the expectedImageData and code-under-test ImageData should be the same
    expect(expectedImageData.data.length).toEqual(imageDataCalled.data.length);

    // generate random test indices
    let testIndices = [];
    for (let i = 0; i < 100; i++) {
      testIndices[i] = Math.floor(Math.random() * expectedImageData.data.length);
    }

    for (let i = 0; i < 100; i++) {
      expect(expectedImageData.data[testIndices[i]]).toEqual(imageDataCalled.data[testIndices[i]]);
    }
  });

  test.each([
    [null, 1024, -40.0, -10.0, COLORMAP_DEFAULT],
    [null, null, -40.0, -10.0, COLORMAP_DEFAULT],
    [null, null, null, -10.0, COLORMAP_DEFAULT],
    [null, null, null, null, COLORMAP_DEFAULT],
    [null, null, null, null, null],
  ])(
    'Image doesnt throw when gettings %s values',
    async (fftsConcatenated, fftSize, magnitudeMin, magnitudeMax, colmap) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
          },
        },
      });
      const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
      const { result } = renderHook(
        () => useGetImage(fftsConcatenated, fftSize, magnitudeMin, magnitudeMax, colmap, 'hamming'),
        {
          wrapper,
        }
      );
      await waitFor(() => {
        expect(result.current.image).toBeNull();
      });
    }
  );
});
