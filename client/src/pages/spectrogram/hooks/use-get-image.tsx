import { fftToRGB } from '@/utils/selector';
import { colMaps } from '@/utils/colormap';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FFT } from '@/utils/fft';
import { fftshift } from 'fftshift';

function calcFftOfSamples(samples: Float32Array, fftSize: number, spectrogramHeight: number, windowFunction: string) {
  //let startTime = performance.now();
  const sampleBlockSize = fftSize * spectrogramHeight;
  let fftsConcatenated = new Float32Array(sampleBlockSize);

  // loop through each row
  for (let i = 0; i < spectrogramHeight; i++) {
    let samples_slice = samples.slice(i * fftSize * 2, (i + 1) * fftSize * 2); // mult by 2 because this is int/floats not IQ samples

    // Apply a hamming window and hanning window
    if (windowFunction === 'hamming') {
      for (let window_i = 0; window_i < fftSize; window_i++) {
        samples_slice[window_i] =
          samples_slice[window_i] * (0.54 - 0.46 * Math.cos((2 * Math.PI * window_i) / (fftSize - 1)));
      }
    } else if (windowFunction === 'hanning') {
      for (let window_i = 0; window_i < fftSize; window_i++) {
        samples_slice[window_i] =
          samples_slice[window_i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * window_i) / (fftSize - 1)));
      }
    } else if (windowFunction === 'bartlett') {
      for (let window_i = 0; window_i < fftSize; window_i++) {
        samples_slice[window_i] =
          samples_slice[window_i] *
          ((2 / (fftSize - 1)) * ((fftSize - 1) / 2) - Math.abs(window_i - (fftSize - 1) / 2));
      }
    } else if (windowFunction === 'blackman') {
      for (let window_i = 0; window_i < fftSize; window_i++) {
        samples_slice[window_i] =
          samples_slice[window_i] *
          (0.42 -
            0.5 * Math.cos((2 * Math.PI * window_i) / fftSize) +
            0.08 * Math.cos((4 * Math.PI * window_i) / fftSize));
      }
    }

    const f = new FFT(fftSize);
    let out = f.createComplexArray(); // creates an empty array the length of fft.size*2
    f.transform(out, samples_slice); // assumes input (2nd arg) is in form IQIQIQIQ and twice the length of fft.size

    out = out.map((x) => x / fftSize); // divide by fftsize

    // convert to magnitude
    let magnitudes = new Array(out.length / 2);
    for (let j = 0; j < out.length / 2; j++) {
      magnitudes[j] = Math.sqrt(Math.pow(out[j * 2], 2) + Math.pow(out[j * 2 + 1], 2)); // take magnitude
    }

    fftshift(magnitudes); // in-place
    magnitudes = magnitudes.map((x) => 10.0 * Math.log10(x)); // convert to dB
    magnitudes = magnitudes.map((x) => (isFinite(x) ? x : 0)); // get rid of -infinity which happens when the input is all 0s

    fftsConcatenated.set(magnitudes, i * fftSize);
  }
  //let endTime = performance.now();
  //console.debug('Calculating FFTs took', endTime - startTime, 'milliseconds'); // first cut of our code processed+rendered 0.5M samples in 760ms on marcs computer
  return fftsConcatenated;
}

export const useTransformData = (fftSize: number, spectrogramHeight: number) => {
  const iqData = new Float32Array(spectrogramHeight * fftSize);

  const transformDataQuery = useQuery<Float32Array>(['iqdata'], () => iqData);

  return { transformDataQuery };
};

export const useGenerateFFTs = (fftSize: number, spectrogramHeight: number) => {
  const { transformDataQuery } = useTransformData(fftSize, spectrogramHeight);

  let samples = transformDataQuery.data;
  const windowFunction = 'hamming';

  const fftQuery = useQuery<Float32Array>(['fftdata'], () =>
    calcFftOfSamples(samples, fftSize, spectrogramHeight, windowFunction)
  );

  return { fftQuery };
};

export const useGetImage = (
  fftSize: number,
  spectrogramHeight: number,
  magnitudeMin: number,
  magnitudeMax: number,
  colmap: string
) => {
  const [image, setImage] = useState<ImageBitmap>(null);

  const { fftQuery } = useGenerateFFTs(fftSize, spectrogramHeight);

  useEffect(() => {
    if (
      !fftQuery.data ||
      !fftSize ||
      isNaN(magnitudeMin) ||
      isNaN(magnitudeMax) ||
      magnitudeMin >= magnitudeMax ||
      !colmap
    ) {
      setImage(null);
    } else {
      const rgbData = fftToRGB(fftQuery.data, fftSize, magnitudeMin, magnitudeMax, colMaps[colmap]);
      let num_final_ffts = fftQuery.data.length / fftSize;
      const newImageData = new ImageData(rgbData, fftSize, num_final_ffts);

      createImageBitmap(newImageData).then((imageBitmap) => {
        setImage(imageBitmap);
      });
    }
  }, [fftQuery.data, fftSize, spectrogramHeight, magnitudeMin, magnitudeMax, colmap]);

  return { image };
};
