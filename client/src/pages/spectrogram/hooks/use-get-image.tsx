import { fftToRGB } from '@/utils/selector';
import { colMaps } from '@/utils/colormap';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { generateSampleIQData } from '@/utils/test-functions';
import { calcFftOfTile } from '@/utils/selector';

export const useGetData = (fftSize: number, spectrogramHeight: number) => {
  const { sampleIQData } = generateSampleIQData(fftSize, spectrogramHeight, 100, 256);

  const getDataQuery = useQuery<Float32Array>(
    ['rawiqdata'],
    () => {
      return sampleIQData;
    },
    { enabled: !!sampleIQData }
  );

  return { getDataQuery };
};

export const useTransformData = (fftSize: number, spectrogramHeight: number) => {
  const { getDataQuery } = useGetData(fftSize, spectrogramHeight);

  const transformDataQuery = useQuery<Float32Array>(
    ['iqdata'],
    () => {
      return getDataQuery.data;
    },
    { enabled: !!getDataQuery.data }
  );

  return { transformDataQuery };
};

export const useGenerateFFTs = (fftSize: number, spectrogramHeight: number, windowFunction: string) => {
  const { transformDataQuery } = useTransformData(fftSize, spectrogramHeight);

  const generateFFTQuery = useQuery<Float32Array>(
    ['fftdata'],
    () => {
      return calcFftOfTile(transformDataQuery.data, fftSize, windowFunction, spectrogramHeight);
    },
    { enabled: !!transformDataQuery.data }
  );

  return { generateFFTQuery };
};

export const useGetImage = (
  fftSize: number,
  spectrogramHeight: number,
  magnitudeMin: number,
  magnitudeMax: number,
  colmap: string,
  windowFunction: string
) => {
  const [image, setImage] = useState<ImageBitmap>(null);

  const { generateFFTQuery } = useGenerateFFTs(fftSize, spectrogramHeight, windowFunction);

  useEffect(() => {
    if (
      !generateFFTQuery.data ||
      !fftSize ||
      isNaN(magnitudeMin) ||
      isNaN(magnitudeMax) ||
      magnitudeMin >= magnitudeMax ||
      !colmap
    ) {
      setImage(null);
    } else {
      const rgbData = fftToRGB(generateFFTQuery.data, fftSize, magnitudeMin, magnitudeMax, colMaps[colmap]);
      let num_final_ffts = generateFFTQuery.data.length / fftSize;
      const newImageData = new ImageData(rgbData, fftSize, num_final_ffts);

      createImageBitmap(newImageData).then((imageBitmap) => {
        setImage(imageBitmap);
      });
    }
  }, [generateFFTQuery.data, fftSize, spectrogramHeight, magnitudeMin, magnitudeMax, colmap]);

  return { image };
};
