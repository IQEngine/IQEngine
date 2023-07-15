import { test, describe } from 'vitest';
import { useGetImage } from '../use-get-image';
import { renderHook, waitFor } from '@testing-library/react';
import { TILE_SIZE_IN_IQ_SAMPLES, COLORMAP_DEFAULT } from '@/utils/constants';

const fftSize = 1024;
const magnitudeMin = -10.0;
const magnitudeMax = -40.0;
describe('DevTest Spectrogram Tests', () => {
  test('useGetImage fftToRGB using average magnitude', async ({ expect }) => {
    const fftsConcatenated = new Float32Array(7 * TILE_SIZE_IN_IQ_SAMPLES);

    // generate expected outcome
    let startOfs = 0;
    let rgbData = new Uint8ClampedArray(fftsConcatenated.length * 4); // 4 because RGBA
    const height = (7 * TILE_SIZE_IN_IQ_SAMPLES) / fftSize;
    for (let i = 0; i < fftsConcatenated.length / fftSize; i++) {
      let line_offset = i * fftSize * 4;
      for (let sigVal, opIdx = 0, ipIdx = startOfs; ipIdx < fftSize + startOfs; opIdx += 4, ipIdx++) {
        rgbData[line_offset + opIdx] = 33; // red
        rgbData[line_offset + opIdx + 1] = 145; // green
        rgbData[line_offset + opIdx + 2] = 140; // blue
        rgbData[line_offset + opIdx + 3] = 255; // alpha
      }
    }
    let num_final_ffts = fftsConcatenated.length / fftSize;
    const expectedImageData = new ImageData(rgbData, fftSize, num_final_ffts);

    // run the code-under-test
    const magnitudeAvg = (magnitudeMax + magnitudeMin) / 2;
    fftsConcatenated.fill(magnitudeAvg);

    const { result } = renderHook(() =>
      useGetImage(fftsConcatenated, fftSize, magnitudeMin, magnitudeMax, COLORMAP_DEFAULT)
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

  test('useGetImage fftToRGB white box', async ({ expect }) => {
    const fftsConcatenated = new Float32Array(7 * TILE_SIZE_IN_IQ_SAMPLES);
    fftsConcatenated[0] = Number.NEGATIVE_INFINITY;

    // generate expected outcome
    let expectedData = new Uint8ClampedArray(7 * TILE_SIZE_IN_IQ_SAMPLES * 4);
    const height = (7 * TILE_SIZE_IN_IQ_SAMPLES) / fftSize;
    expectedData.fill(255);
    const expectedImageData = new ImageData(expectedData, fftSize, height);

    // run the code-under-test
    const { result } = renderHook(() =>
      useGetImage(fftsConcatenated, fftSize, magnitudeMin, magnitudeMax, COLORMAP_DEFAULT)
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

  test.each([
    [null, 1024, -10.0, -40.0, COLORMAP_DEFAULT],
    [null, null, -10.0, -40.0, COLORMAP_DEFAULT],
    [null, null, null, -40.0, COLORMAP_DEFAULT],
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
