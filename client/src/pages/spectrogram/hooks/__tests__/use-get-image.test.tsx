import { test, describe } from 'vitest';
import { useGetImage } from '../use-get-image';
import { renderHook, waitFor } from '@testing-library/react';
import { TILE_SIZE_IN_IQ_SAMPLES, COLORMAP_DEFAULT } from '@/utils/constants';
import { colMaps } from '@/utils/colormap';
import { Simulate } from 'react-dom/test-utils';

const fftSize = 1024;
const magnitudeMin = -40.0;
const magnitudeMax = -10.0;

const normalizeMagnitude = (magnitude_in_db: number, magnitudeMin: number, magnitudeMax: number) => {
  const dbPer1 = 255 / (magnitudeMax - magnitudeMin);
  let magnitude = (magnitude_in_db - magnitudeMin) * dbPer1; // normalize to 0-255
  magnitude = magnitude > 255 ? 255 : magnitude; // clip above 255
  magnitude = magnitude < 0 ? 0 : magnitude; // clip below 0
  return magnitude;
};

const generateSampleRecording = () => {
  const height = TILE_SIZE_IN_IQ_SAMPLES / fftSize;
  const sampleRecording = new Float32Array(TILE_SIZE_IN_IQ_SAMPLES);
  let num_ffts = sampleRecording.length / fftSize;
  for (let i = 0; i < num_ffts; i++) {
    let line_offset = i * fftSize;
    for (let bucket = 0; bucket < BucketsOfDb.length; bucket++) {
      for (let j = 0; j < fftSize / BucketsOfDb.length; j++) {
        const index = line_offset + (bucket * fftSize) / BucketsOfDb.length + j;
        sampleRecording[index] = BucketsOfDb[bucket];
      }
    }
  }
  return { sampleRecording, fftSize, num_ffts };
};

// 16 elements exactly
const BucketsOfDb = [-100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];

describe('DevTest Spectrogram Tests', () => {
  test('useGetImage fftToRGB using wide range of magnitudes', async ({ expect }) => {
    // generate recording in dB
    const { sampleRecording, fftSize, num_ffts } = generateSampleRecording();

    // expected outcome:
    // normalize to 0-255
    const fftsExpectedNorm = new Float32Array(TILE_SIZE_IN_IQ_SAMPLES);
    for (let i = 0; i < sampleRecording.length; i++) {
      fftsExpectedNorm[i] = normalizeMagnitude(sampleRecording[i], magnitudeMin, magnitudeMax);
    }
    let ipBuf8 = Uint8ClampedArray.from(fftsExpectedNorm);
    // colorized
    let newFftData = new Uint8ClampedArray(sampleRecording.length * 4); // 4 because RGBA
    for (let sigVal, opIdx = 0, ipIdx = 0; ipIdx < sampleRecording.length; opIdx += 4, ipIdx++) {
      sigVal = ipBuf8[ipIdx];
      newFftData[opIdx] = colMaps[COLORMAP_DEFAULT][sigVal][0]; // red
      newFftData[opIdx + 1] = colMaps[COLORMAP_DEFAULT][sigVal][1]; // green
      newFftData[opIdx + 2] = colMaps[COLORMAP_DEFAULT][sigVal][2]; // blue
      newFftData[opIdx + 3] = 255; // alpha
    }
    const expectedImageData = new ImageData(newFftData, fftSize, num_ffts);

    // run the code-under-test
    const { result } = renderHook(() =>
      useGetImage(sampleRecording, fftSize, magnitudeMin, magnitudeMax, COLORMAP_DEFAULT)
    );
    await waitFor(() => {
      expect(result.current.image).not.toBeNull();
    });

    // get the ImageData of the code-under-test ImageBitmap
    const lastCall = createImageBitmap.mock.lastCall;
    const imageDataCalled = lastCall[0];

    // compare the ImageData objects - looking for a better way...
    let imagesAreTheSame = true;
    if (expectedImageData.data.length != imageDataCalled.data.length) {
      imagesAreTheSame = false;
    } else {
      for (var i = 0; i < expectedImageData.data.length; ++i) {
        if (expectedImageData.data[i] != imageDataCalled.data[i]) {
          imagesAreTheSame = false;
          break;
        }
      }
    }

    // code-under-test should generate an image of the correct height and width
    expect(result.current.image.width).toEqual(fftSize);
    expect(result.current.image.height).toEqual(num_ffts);

    // the expectedImageData and code-under-test ImageData should be the same
    expect(imagesAreTheSame).toBeTruthy();
  });

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

  test('useGetImage fftToRGB using mock & avg min/max', async ({ expect }) => {
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

    const lastCall = createImageBitmap.mock.lastCall;
    const imageDataCalled = lastCall[0];

    // compare the ImageData objects - looking for a better way...
    let imagesAreTheSame = true;
    if (expectedImageData.data.length != imageDataCalled.data.length) {
      imagesAreTheSame = false;
    } else {
      for (var i = 0; i < expectedImageData.data.length; ++i) {
        if (expectedImageData.data[i] != imageDataCalled.data[i]) {
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
