import { test, describe } from 'vitest';
import { useGetImage } from '../use-get-image';
import { renderHook, waitFor } from '@testing-library/react';
import { TILE_SIZE_IN_IQ_SAMPLES, COLORMAP_DEFAULT } from '@/utils/constants';
import { colMaps } from '@/utils/colormap';
import { Simulate } from 'react-dom/test-utils';

// const fftSize = 1024;
// const magnitudeMin = -40.0;
// const magnitudeMax = -10.0;

// 16 elements exactly
const BucketsOfDb = [-100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];

// types of sample recordings
enum SampleType {
  MultipleBuckets = 0,
  WhiteBox = 1,
}

const normalizeMagnitude = (magnitude_in_db: number, magnitudeMin: number, magnitudeMax: number) => {
  const dbPer1 = 255 / (magnitudeMax - magnitudeMin);
  let magnitude = (magnitude_in_db - magnitudeMin) * dbPer1; // normalize to 0-255
  magnitude = magnitude > 255 ? 255 : magnitude; // clip above 255
  magnitude = magnitude < 0 ? 0 : magnitude; // clip below 0
  return magnitude;
};

const generateSampleRecording = (
  tile_size: number,
  fftSize: number,
  recordingType: SampleType,
  magnitudeMin: number,
  magnitudeMax: number,
  colorMap: string
) => {
  const sampleRecording = new Float32Array(tile_size);
  let num_ffts = sampleRecording.length / fftSize;
  let expectedImageData = new ImageData(1, 1);

  if (recordingType == SampleType.MultipleBuckets) {
    for (let i = 0; i < num_ffts; i++) {
      let line_offset = i * fftSize;
      for (let bucket = 0; bucket < BucketsOfDb.length; bucket++) {
        for (let j = 0; j < fftSize / BucketsOfDb.length; j++) {
          const index = line_offset + (bucket * fftSize) / BucketsOfDb.length + j;
          sampleRecording[index] = BucketsOfDb[bucket];
        }
      }
    }
  } else if (recordingType == SampleType.WhiteBox) {
    sampleRecording.fill(255);
  }

  // normalize to 0-255
  const fftsNormalized = new Float32Array(tile_size);
  for (let i = 0; i < sampleRecording.length; i++) {
    fftsNormalized[i] = normalizeMagnitude(sampleRecording[i], magnitudeMin, magnitudeMax);
  }
  let ipBuf8 = Uint8ClampedArray.from(fftsNormalized);
  // colorized
  let newFftData = new Uint8ClampedArray(sampleRecording.length * 4); // 4 because RGBA
  for (let sigVal, opIdx = 0, ipIdx = 0; ipIdx < sampleRecording.length; opIdx += 4, ipIdx++) {
    sigVal = ipBuf8[ipIdx];
    newFftData[opIdx] = colMaps[colorMap][sigVal][0]; // red
    newFftData[opIdx + 1] = colMaps[colorMap][sigVal][1]; // green
    newFftData[opIdx + 2] = colMaps[colorMap][sigVal][2]; // blue
    newFftData[opIdx + 3] = 255; // alpha
  }
  expectedImageData = new ImageData(newFftData, fftSize, num_ffts);

  return { sampleRecording, num_ffts, expectedImageData };
};

const imagesAreTheSame = (imageDataA: ImageData, imageDataB: ImageData) => {
  // compare the ImageData objects - looking for a better way...
  let same = true;
  if (imageDataA.data.length != imageDataB.data.length) {
    same = false;
  } else {
    for (var i = 0; i < imageDataA.data.length; ++i) {
      if (imageDataA.data[i] != imageDataB.data[i]) {
        same = false;
        break;
      }
    }
  }
  return { same };
};

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

      const { same } = imagesAreTheSame(expectedImageData, imageDataCalled);

      // code-under-test should generate an image of the correct height and width
      expect(result.current.image.width).toEqual(fftSize);
      expect(result.current.image.height).toEqual(num_ffts);

      // the expectedImageData and code-under-test ImageData should be the same
      expect(same).toBeTruthy();
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
