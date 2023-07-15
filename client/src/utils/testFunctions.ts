import { colMaps } from '@/utils/colormap';

// types of sample recordings
export enum SampleType {
  MultipleBuckets = 0,
  WhiteBox = 1,
}

// 16 elements exactly
const BucketsOfDb = [-100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];

export const normalizeMagnitude = (magnitude_in_db: number, magnitudeMin: number, magnitudeMax: number) => {
  const dbPer1 = 255 / (magnitudeMax - magnitudeMin);
  let magnitude = (magnitude_in_db - magnitudeMin) * dbPer1; // normalize to 0-255
  magnitude = magnitude > 255 ? 255 : magnitude; // clip above 255
  magnitude = magnitude < 0 ? 0 : magnitude; // clip below 0
  return magnitude;
};

export const generateSampleRecording = (
  tile_size: number,
  fftSize: number,
  recordingType: SampleType,
  magnitudeMin: number,
  magnitudeMax: number,
  colorMap: string
) => {
  if (fftSize == 0) {
    return { sampleRecording: null, num_ffts: 0, expectedImageData: null };
  }

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
