import { test, describe } from 'vitest';
import { useGetImage } from '../use-get-image';
import { renderHook, waitFor } from '@testing-library/react';
import { TILE_SIZE_IN_IQ_SAMPLES, COLORMAP_DEFAULT } from '@/utils/constants';
import { imageToBlob } from 'browser-fs-access';

describe('DevTest Spectrogram Tests', () => {
  test('useGetImage fftToRGB white box', async ({ expect }) => {
    const fftSize = 1024;
    const magnitudeMin = -10.0;
    const magnitudeMax = -40.0;
    const totalFftData = new Float32Array(7 * TILE_SIZE_IN_IQ_SAMPLES);
    totalFftData[0] = Number.NEGATIVE_INFINITY;

    const { result } = renderHook(() =>
      useGetImage(totalFftData, fftSize, magnitudeMin, magnitudeMax, COLORMAP_DEFAULT)
    );
    await waitFor(() => {
      expect(result.current.image).not.toBeNull();
    });
    expect(result.current.image.width).toBe(fftSize);
  });
  test.each([
    [null, 1024, -10.0, -40.0, COLORMAP_DEFAULT],
    [null, null, -10.0, -40.0, COLORMAP_DEFAULT],
    [null, null, null, -40.0, COLORMAP_DEFAULT],
    [null, null, null, null, COLORMAP_DEFAULT],
    [null, null, null, null, null],
  ])(
    'Image doesnt throw when gettings %s values',
    async (totalFftData, fftSize, magnitudeMin, magnitudeMax, colmap) => {
      const { result } = renderHook(() => useGetImage(totalFftData, fftSize, magnitudeMin, magnitudeMax, colmap));
      await waitFor(() => {
        expect(result.current.image).toBeNull();
      });
    }
  );
});
