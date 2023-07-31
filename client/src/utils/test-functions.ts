import { colMaps } from '@/utils/colormap';
import { calcFftOfTile } from './selector';

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

export const generateSampleIQData = (
  fftSize: number,
  num_ffts: number,
  frequency: number = 1000,
  sampleRate: number = 2000
) => {
  const num_samples = num_ffts * fftSize * 2;
  const sampleIQData = new Float32Array(num_samples);
  const increment = (2 * Math.PI * frequency) / sampleRate;
  let angle = 0;
  for (let i = 0; i < num_samples; i++) {
    sampleIQData[i] = Math.sin(angle);
    angle += increment;
  }
  return { sampleIQData };
};

export const generateSampleImageData = (
  tile_size: number,
  fftSize: number,
  recordingType: SampleType,
  magnitudeMin: number,
  magnitudeMax: number,
  colorMap: string
) => {
  if (fftSize == 0) {
    return { sampleImageData: null, num_ffts: 0, expectedImageData: null };
  }

  let num_ffts = tile_size / fftSize;
  let expectedImageData = new ImageData(1, 1);
  const { sampleIQData } = generateSampleIQData(fftSize, num_ffts);
  const ffts = calcFftOfTile(sampleIQData, fftSize, 'hamming', num_ffts);

  // normalize to 0-255
  const fftsNormalized = new Float32Array(ffts.length);
  for (let i = 0; i < ffts.length; i++) {
    fftsNormalized[i] = normalizeMagnitude(ffts[i], magnitudeMin, magnitudeMax);
  }
  let ipBuf8 = Uint8ClampedArray.from(fftsNormalized);
  // colorized
  let newFftData = new Uint8ClampedArray(fftsNormalized.length * 4); // 4 because RGBA
  for (let sigVal, opIdx = 0, ipIdx = 0; ipIdx < fftsNormalized.length; opIdx += 4, ipIdx++) {
    sigVal = ipBuf8[ipIdx];
    newFftData[opIdx] = colMaps[colorMap][sigVal][0]; // red
    newFftData[opIdx + 1] = colMaps[colorMap][sigVal][1]; // green
    newFftData[opIdx + 2] = colMaps[colorMap][sigVal][2]; // blue
    newFftData[opIdx + 3] = 255; // alpha
  }
  expectedImageData = new ImageData(newFftData, fftSize, num_ffts);

  return { sampleIQData, num_ffts, expectedImageData };
};
