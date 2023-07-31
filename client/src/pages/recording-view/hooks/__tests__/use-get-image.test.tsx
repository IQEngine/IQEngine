import { test, describe } from 'vitest';
import { useGetImage } from '../use-get-image';
import { renderHook, waitFor } from '@testing-library/react';
import { TILE_SIZE_IN_IQ_SAMPLES as tilesize, COLORMAP_DEFAULT } from '@/utils/constants';
import { SampleType, generateSampleImageData, normalizeMagnitude, generateSampleIQData } from '@/utils/test-functions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { calcFftOfTile } from '@/utils/selector';

describe('DevTest Spectrogram Tests', () => {
  //template test.each([[], []])('test', async () => {});
  test.each([
    ['500hz', 1024, 100, 500, 2048, 'hamming'],
    ['50hz', 1024, 100, 50, 2048, 'hanning'],
    ['10hz', 1024, 100, 10, 2048, 'bartlett'],
    ['250hz', 512, 100, 250, 2048, 'hamming'],
    ['50hz', 512, 100, 50, 2048, 'hanning'],
    ['10hz', 512, 100, 10, 2048, 'bartlett'],
    ['250hz', 2048, 100, 250, 4096, 'hamming'],
    ['50hz', 2048, 100, 50, 4096, 'hanning'],
    ['10hz', 2048, 100, 10, 4096, 'bartlett'],
  ])(
    'calcFftOfTile should return correct FFT for standard inputs: %s',
    async (comment, fftSize, spectrogramHeight, frequency, sample_rate, windowFunction) => {
      const { sampleIQData } = generateSampleIQData(fftSize, spectrogramHeight, frequency, sample_rate);
      const fftsConcatenated = calcFftOfTile(sampleIQData, fftSize, windowFunction, spectrogramHeight);

      expect(fftsConcatenated.length).toEqual(fftSize * spectrogramHeight);

      const centerPoint = fftSize / 2 + fftSize;

      // expect the magnitude at fftSize/2-frequency to be peak
      const leftPeak = fftsConcatenated[centerPoint - frequency];
      const rightOfLeftPeak = fftsConcatenated[centerPoint - (frequency + 1)];
      const leftOfLeftPeak = fftsConcatenated[centerPoint - (frequency - 1)];

      expect(leftPeak).toBeGreaterThan(rightOfLeftPeak);
      expect(leftPeak).toBeGreaterThan(leftOfLeftPeak);
    }
  );
  // want fftsize to be at most sample_rate/2 so there's at least one pixel for each sample
  // frequency should be a few less than 1/2 of sample rate so peak isn't shoved off the frame
  // making sample_rate a power of 2 avoids rounding errors when locating peak pixel
  test.each([
    ['10 hz', 100, 1024, 10, 2048, 'hamming'],
    ['20 hz', 100, 1024, 20, 2048, 'hanning'],
    ['30 hz', 100, 1024, 30, 2048, 'bartlett'],
    ['100 hz', 100, 1024, 100, 2048, 'blackman'],
    ['1000 hz', 100, 1024, 1000, 2048, 'hamming'],
    ['10 hz', 100, 512, 10, 1024, 'hamming'],
    ['20 hz', 100, 512, 20, 1024, 'hamming'],
    ['30 hz', 100, 512, 30, 1024, 'bartlett'],
    ['100 hz', 100, 512, 100, 1024, 'blackman'],
    ['500 hz', 100, 512, 500, 1024, 'hamming'],
  ])(
    'Test that generated IQ produces correct FFTs, %s',
    async (comment, spectrogramHeight, fftSize, frequency, sampleRate, windowFunction) => {
      const { sampleIQData } = generateSampleIQData(fftSize, spectrogramHeight, frequency, sampleRate);

      // run the code-under-test
      const fftResult = calcFftOfTile(sampleIQData, fftSize, windowFunction, spectrogramHeight);
      expect(fftResult.length / fftSize).toEqual(spectrogramHeight);
      for (let i = 1; i < 10; i++) {
        const centerPoint = fftSize / 2 + i * fftSize;

        // expect the magnitude at fftSize/2-frequency to be peak
        const leftPeak = fftResult[centerPoint - frequency];
        const rightOfLeftPeak = fftResult[centerPoint - (frequency + 1)];
        const leftOfLeftPeak = fftResult[centerPoint - (frequency - 1)];

        expect(leftPeak).toBeGreaterThan(rightOfLeftPeak);
        expect(leftPeak).toBeGreaterThan(leftOfLeftPeak);

        // expect the magnitude at fftSize/2+frequency to be peak
        const rightPeak = fftResult[centerPoint + frequency];
        const rightOfRightPeak = fftResult[centerPoint + (frequency + 1)];
        const leftOfRightPeak = fftResult[centerPoint + (frequency - 1)];

        expect(rightPeak).toBeGreaterThan(rightOfRightPeak);
        expect(rightPeak).toBeGreaterThan(leftOfRightPeak);
      }
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
  ])(
    'Unacceptable parameters should be rejected: %s',
    async (comment, tile_size, fftSize, magnitudeMin, magnitudeMax, colorMap, sampleType) => {
      const spectrogramHeight = tile_size / (fftSize == 0 ? 1024 : fftSize);

      // run the code-under-test
      const { result } = renderHook(() =>
        useGetImage(fftSize, spectrogramHeight, magnitudeMin, magnitudeMax, colorMap, 'hamming')
      );
      await waitFor(() => {
        expect(result.current.image).toBeNull();
      });
    }
  );

  test.each([
    // ['128,multi-dB', tilesize, 128, -40.0, 0.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    // ['256,multi-dB', tilesize, 256, -30.0, -20.0, 'jet', SampleType.MultipleBuckets],
    // ['512,multi-dB', tilesize, 512, -60.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    // ['defaults,multi-dB', tilesize, 1024, -40.0, -10.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    // ['defaults,jet,multi-dB', tilesize, 1024, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    // ['2048,jet,multi-dB', tilesize, 2048, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    // ['-80/0,plasma,multi-dB', tilesize, 1024, -80.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    // ['4096,-20/20,multi-dB', tilesize, 4096, -20.0, 20.0, 'plasma', SampleType.MultipleBuckets],
    // ['8192,-60/50,inferno,multi-dB', tilesize, 8192, -60.0, 50.0, 'inferno', SampleType.MultipleBuckets],
    // ['16384,-100/50,multi-dB', tilesize, 16384, -100.0, 50.0, 'inferno', SampleType.MultipleBuckets],

    ['128,white box', tilesize, 128, -40.0, 0.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    // ['256,white box', tilesize, 256, -30.0, -20.0, 'jet', SampleType.MultipleBuckets],
    // ['512,white box', tilesize, 512, -60.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    // ['defaults,white box', tilesize, 1024, -40.0, -10.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    // ['defaults,jet,white box', tilesize, 1024, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    // ['2048,jet,white box', tilesize, 2048, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    // ['-80/0,plasma,white box', tilesize, 1024, -80.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    // ['4096,-20/20,white box', tilesize, 4096, -20.0, 20.0, 'plasma', SampleType.MultipleBuckets],
    // ['8192,-60/50,inferno,white box', tilesize, 8192, -60.0, 50.0, 'inferno', SampleType.MultipleBuckets],
    // ['16384,-100/50,white box', tilesize, 16384, -100.0, 50.0, 'inferno', SampleType.MultipleBuckets],
  ])(
    'RGB is generated correctly from the following fftdata: %s',
    async (comment, tile_size, fftSize, magnitudeMin, magnitudeMax, colorMap, sampleType) => {
      const { sampleImageData, num_ffts, expectedImageData } = generateSampleImageData(
        tile_size,
        fftSize,
        sampleType,
        magnitudeMin,
        magnitudeMax,
        colorMap
      );
      const spectrogramHeight = tile_size / (fftSize == 0 ? 1024 : fftSize);

      // run the code-under-test
      const { result } = renderHook(() =>
        useGetImage(fftSize, spectrogramHeight, magnitudeMin, magnitudeMax, colorMap, 'hamming')
      );
      result.current.setIQData(sampleImageData);
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
    }
  );

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
