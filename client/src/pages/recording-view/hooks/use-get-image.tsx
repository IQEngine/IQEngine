import { fftToRGB } from '@/utils/selector';
import { colMaps } from '@/utils/colormap';
import { useEffect, useMemo, useState } from 'react';
import { calcFftOfTile } from '@/utils/selector';

export const useGetImage = (
  fftSize: number,
  spectrogramHeight: number,
  magnitudeMin: number,
  magnitudeMax: number,
  colmap: string,
  windowFunction: string
) => {
  const [image, setImage] = useState<ImageBitmap>(null);
  const [iqData, setIQData] = useState<Float32Array>(null);

  const ffts = useMemo(() => {
    if (!iqData || !fftSize) return null;
    //performance.mark('calcFftOfTile');
    const ffts_calc = calcFftOfTile(iqData, fftSize, windowFunction, spectrogramHeight);
    //console.debug(performance.measure('calcFftOfTile', 'calcFftOfTile'));
    return ffts_calc;
  }, [iqData, fftSize, windowFunction, spectrogramHeight]);

  useEffect(() => {
    if (!ffts || !fftSize || isNaN(magnitudeMin) || isNaN(magnitudeMax) || magnitudeMin >= magnitudeMax || !colmap) {
      setImage(null);
    } else {
      const rgbData = fftToRGB(ffts, fftSize, magnitudeMin, magnitudeMax, colMaps[colmap]);
      let num_final_ffts = ffts.length / fftSize;
      const newImageData = new ImageData(rgbData, fftSize, num_final_ffts);

      createImageBitmap(newImageData).then((imageBitmap) => {
        setImage(imageBitmap);
      });
    }
  }, [ffts, magnitudeMin, magnitudeMax, colmap]);

  return { image, setIQData, ffts };
};
