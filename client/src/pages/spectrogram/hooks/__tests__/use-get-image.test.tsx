import { test, describe } from 'vitest';
import { useGetImage } from '../use-get-image';
import { renderHook, waitFor } from '@testing-library/react';
import { TILE_SIZE_IN_IQ_SAMPLES, COLORMAP_DEFAULT } from '@/utils/constants';
import { SampleType, generateSampleRecording, normalizeMagnitude } from '@/utils/testFunctions';

describe('DevTest Spectrogram Tests', () => {
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
    ['min=NaN', TILE_SIZE_IN_IQ_SAMPLES, 128, NaN, 10.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    ['max=Nan', TILE_SIZE_IN_IQ_SAMPLES, 128, -10.0, NaN, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    ['min>max', TILE_SIZE_IN_IQ_SAMPLES, 256, -20.0, -30.0, 'jet', SampleType.MultipleBuckets],
    ['min==max', TILE_SIZE_IN_IQ_SAMPLES, 512, -60.0, -60.0, 'plasma', SampleType.MultipleBuckets],
    ['fftSize==0', TILE_SIZE_IN_IQ_SAMPLES, 0, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],

    ['min=NaN', TILE_SIZE_IN_IQ_SAMPLES, 128, NaN, 10.0, COLORMAP_DEFAULT, SampleType.WhiteBox],
    ['max=Nan', TILE_SIZE_IN_IQ_SAMPLES, 128, -10.0, NaN, COLORMAP_DEFAULT, SampleType.WhiteBox],
    ['min>max', TILE_SIZE_IN_IQ_SAMPLES, 256, -20.0, -30.0, 'jet', SampleType.WhiteBox],
    ['min==max', TILE_SIZE_IN_IQ_SAMPLES, 512, -60.0, -60.0, 'plasma', SampleType.WhiteBox],
    ['fftSize==0', TILE_SIZE_IN_IQ_SAMPLES, 0, -40.0, -10.0, 'jet', SampleType.WhiteBox],
  ])('Failing test: %s', async (comment, tile_size, fftSize, magnitudeMin, magnitudeMax, colorMap, sampleType) => {
    const { sampleRecording } = generateSampleRecording(
      tile_size,
      fftSize,
      sampleType,
      magnitudeMin,
      magnitudeMax,
      colorMap
    );

    // run the code-under-test
    const { result } = renderHook(() => useGetImage(sampleRecording, fftSize, magnitudeMin, magnitudeMax, colorMap));
    await waitFor(() => {
      expect(result.current.image).toBeNull();
    });
  });

  test.each([
    ['128,multi-dB', TILE_SIZE_IN_IQ_SAMPLES, 128, -40.0, 0.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    ['256,multi-dB', TILE_SIZE_IN_IQ_SAMPLES, 256, -30.0, -20.0, 'jet', SampleType.MultipleBuckets],
    ['512,multi-dB', TILE_SIZE_IN_IQ_SAMPLES, 512, -60.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    ['defaults,multi-dB', TILE_SIZE_IN_IQ_SAMPLES, 1024, -40.0, -10.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    ['defaults,jet,multi-dB', TILE_SIZE_IN_IQ_SAMPLES, 1024, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    ['2048,jet,multi-dB', TILE_SIZE_IN_IQ_SAMPLES, 2048, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    ['-80/0,plasma,multi-dB', TILE_SIZE_IN_IQ_SAMPLES, 1024, -80.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    ['4096,-20/20,multi-dB', TILE_SIZE_IN_IQ_SAMPLES, 4096, -20.0, 20.0, 'plasma', SampleType.MultipleBuckets],
    ['8192,-60/50,inferno,multi-dB', TILE_SIZE_IN_IQ_SAMPLES, 8192, -60.0, 50.0, 'inferno', SampleType.MultipleBuckets],
    ['16384,-100/50,multi-dB', TILE_SIZE_IN_IQ_SAMPLES, 16384, -100.0, 50.0, 'inferno', SampleType.MultipleBuckets],

    ['128,white box', TILE_SIZE_IN_IQ_SAMPLES, 128, -40.0, 0.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    ['256,white box', TILE_SIZE_IN_IQ_SAMPLES, 256, -30.0, -20.0, 'jet', SampleType.MultipleBuckets],
    ['512,white box', TILE_SIZE_IN_IQ_SAMPLES, 512, -60.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    ['defaults,white box', TILE_SIZE_IN_IQ_SAMPLES, 1024, -40.0, -10.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    ['defaults,jet,white box', TILE_SIZE_IN_IQ_SAMPLES, 1024, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    ['2048,jet,white box', TILE_SIZE_IN_IQ_SAMPLES, 2048, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    ['-80/0,plasma,white box', TILE_SIZE_IN_IQ_SAMPLES, 1024, -80.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    ['4096,-20/20,white box', TILE_SIZE_IN_IQ_SAMPLES, 4096, -20.0, 20.0, 'plasma', SampleType.MultipleBuckets],
    [
      '8192,-60/50,inferno,white box',
      TILE_SIZE_IN_IQ_SAMPLES,
      8192,
      -60.0,
      50.0,
      'inferno',
      SampleType.MultipleBuckets,
    ],
    ['16384,-100/50,white box', TILE_SIZE_IN_IQ_SAMPLES, 16384, -100.0, 50.0, 'inferno', SampleType.MultipleBuckets],
  ])('Passing test: %s', async (comment, tile_size, fftSize, magnitudeMin, magnitudeMax, colorMap, sampleType) => {
    const { sampleRecording, num_ffts, expectedImageData } = generateSampleRecording(
      tile_size,
      fftSize,
      sampleType,
      magnitudeMin,
      magnitudeMax,
      colorMap
    );

    // run the code-under-test
    const { result } = renderHook(() => useGetImage(sampleRecording, fftSize, magnitudeMin, magnitudeMax, colorMap));
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
      const { result } = renderHook(() => useGetImage(fftsConcatenated, fftSize, magnitudeMin, magnitudeMax, colmap));
      await waitFor(() => {
        expect(result.current.image).toBeNull();
      });
    }
  );
});
