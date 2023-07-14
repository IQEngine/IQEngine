import { test, describe } from 'vitest';
import { useGetImage } from '../use-get-image';
import { renderHook, waitFor } from '@testing-library/react';
import { TILE_SIZE_IN_IQ_SAMPLES, COLORMAP_DEFAULT } from '@/utils/constants';

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
    waitFor(() => {
      expect(result.current.image).not.toBeNull();
    }).then(() => {
      expect(result.current.image.width).toBe(fftSize);
    });
  });
});
