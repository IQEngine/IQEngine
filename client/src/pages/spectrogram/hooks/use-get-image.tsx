import { fftToRGB } from '@/utils/selector';
import { colMaps } from '@/utils/colormap';
import { useEffect, useState } from 'react';

export const useGetImage = (
  totalFftData: Float32Array,
  fftSize: number,
  magnitudeMin: number,
  magnitudeMax: number,
  colmap: string
) => {
  const [image, setImage] = useState<ImageBitmap>(null);

  useEffect(() => {
    if (!totalFftData || !fftSize || !magnitudeMin || !magnitudeMax || !colmap) {
      setImage(null);
      return;
    }
    const rgbData = fftToRGB(totalFftData, fftSize, magnitudeMin, magnitudeMax, colMaps[colmap]);
    let num_final_ffts = totalFftData.length / fftSize;
    const newImageData = new ImageData(rgbData, fftSize, num_final_ffts);

    createImageBitmap(newImageData).then((imageBitmap) => {
      setImage(imageBitmap);
    });

    console.debug(
      'size of totalFftData:',
      totalFftData.length,
      'fftSize:',
      fftSize,
      ', magnitudeMin:',
      magnitudeMin,
      ', magnitudeMax:',
      magnitudeMax,
      ', num_final_ffts:',
      num_final_ffts
    );
  }, [totalFftData, fftSize, magnitudeMin, magnitudeMax, colmap]);

  return { image };
};
