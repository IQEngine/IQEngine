import { test, describe } from 'vitest';
import { useGetImage } from '../use-get-image';
import { renderHook, waitFor } from '@testing-library/react';
import { TILE_SIZE_IN_IQ_SAMPLES, COLORMAP_DEFAULT } from '@/utils/constants';

const fftSize = 1024;
const magnitudeMin = -10.0;
const magnitudeMax = -40.0;

describe('DevTest Spectrogram Tests', () => {
  test('useGetImage fftToRGB white box', async ({ expect }) => {
    const totalFftData = new Float32Array(7 * TILE_SIZE_IN_IQ_SAMPLES);
    totalFftData[0] = Number.NEGATIVE_INFINITY;

    // generate expected outcome
    let expectedData = new Uint8ClampedArray(7 * TILE_SIZE_IN_IQ_SAMPLES * 4);
    const height = (7 * TILE_SIZE_IN_IQ_SAMPLES) / fftSize;
    expectedData.fill(255);
    const expectedImageData = new ImageData(expectedData, fftSize, height);

    // run the code-under-test
    const { result } = renderHook(() =>
      useGetImage(totalFftData, fftSize, magnitudeMin, magnitudeMax, COLORMAP_DEFAULT)
    );
    await waitFor(() => {
      expect(result.current.image).not.toBeNull();
    });

    // compare the ImageData objects - looking for a better way...
    let imagesAreTheSame = true;
    if (expectedImageData.data.length != result.current.imageData.data.length) {
      imagesAreTheSame = false;
    } else {
      for (var i = 0; i < expectedImageData.data.length; ++i) {
        if (expectedImageData.data[i] != result.current.imageData.data[i]) {
          imagesAreTheSame = false;
          break;
        }
      }
    }

    // code-under-test should generate an image of the correct height and width
    expect(result.current.image.width).toEqual(fftSize);
    expect(result.current.image.height).toEqual(height);

    // the expectedImageData and code-under-test ImageData should be the same
    expect(imagesAreTheSame).toBeTruthy();
  });
});
