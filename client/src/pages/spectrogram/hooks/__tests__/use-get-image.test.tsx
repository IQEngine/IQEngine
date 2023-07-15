import { test, describe } from 'vitest';
import { useGetImage } from '../use-get-image';
import { renderHook, waitFor } from '@testing-library/react';
import { TILE_SIZE_IN_IQ_SAMPLES, COLORMAP_DEFAULT } from '@/utils/constants';
import { SampleType, generateSampleRecording } from '@/utils/testFunctions';

describe('DevTest Spectrogram Tests', () => {
  test.each([
    [TILE_SIZE_IN_IQ_SAMPLES, 1024, -40.0, -10.0, COLORMAP_DEFAULT, SampleType.MultipleBuckets],
    [TILE_SIZE_IN_IQ_SAMPLES, 1024, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    [TILE_SIZE_IN_IQ_SAMPLES, 2048, -40.0, -10.0, 'jet', SampleType.MultipleBuckets],
    [TILE_SIZE_IN_IQ_SAMPLES, 1024, -80.0, 10.0, 'plasma', SampleType.MultipleBuckets],
    [TILE_SIZE_IN_IQ_SAMPLES, 4096, -20.0, 20.0, 'plasma', SampleType.MultipleBuckets],
    [TILE_SIZE_IN_IQ_SAMPLES, 8192, -60.0, 50.0, 'inferno', SampleType.MultipleBuckets],
    [TILE_SIZE_IN_IQ_SAMPLES, 16384, -100.0, 50.0, 'inferno', SampleType.MultipleBuckets],

    [TILE_SIZE_IN_IQ_SAMPLES, 1024, -40.0, -10.0, COLORMAP_DEFAULT, SampleType.WhiteBox],
    [TILE_SIZE_IN_IQ_SAMPLES, 1024, -40.0, -10.0, 'jet', SampleType.WhiteBox],
    [TILE_SIZE_IN_IQ_SAMPLES, 2048, -40.0, -10.0, 'jet', SampleType.WhiteBox],
    [TILE_SIZE_IN_IQ_SAMPLES, 1024, -80.0, 10.0, 'plasma', SampleType.WhiteBox],
    [TILE_SIZE_IN_IQ_SAMPLES, 4096, -20.0, 20.0, 'plasma', SampleType.WhiteBox],
    [TILE_SIZE_IN_IQ_SAMPLES, 8192, -60.0, 50.0, 'inferno', SampleType.WhiteBox],
    [TILE_SIZE_IN_IQ_SAMPLES, 16384, -100.0, 50.0, 'inferno', SampleType.WhiteBox],
  ])(
    'multiple tests parameterized as %s',
    async (tile_size, fftSize, magnitudeMin, magnitudeMax, colorMap, sampleType) => {
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
      const { result } = renderHook(() => useGetImage(fftsConcatenated, fftSize, magnitudeMin, magnitudeMax, colmap));
      await waitFor(() => {
        expect(result.current.image).toBeNull();
      });
    }
  );
});
