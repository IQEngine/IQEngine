import { Layer, Image, Stage } from 'react-konva';
import React, { useEffect, useState } from 'react';
import { useGetImage } from '@/pages/spectrogram/hooks/use-get-image';
import { TILE_SIZE_IN_IQ_SAMPLES, COLORMAP_DEFAULT } from '@/utils/constants';

const totalFftData = new Float32Array(7 * TILE_SIZE_IN_IQ_SAMPLES);

export const DevTestPage = () => {
  const [spectrogramHeight, setSpectrogramHeight] = useState(800);
  const [spectrogramWidth, setSpectrogramWidth] = useState(1000);
  const fftSize = 1024;
  const magnitudeMin = -10.0;
  const magnitudeMax = -40.0;
  totalFftData[0] = Number.NEGATIVE_INFINITY;

  let { image } = useGetImage(totalFftData, fftSize, magnitudeMin, magnitudeMax, COLORMAP_DEFAULT);

  return (
    <div className="block">
      <div className="flex flex-col pl-3">
        <div className="flex flex-row">
          <Stage width={spectrogramWidth} height={spectrogramHeight}>
            <Layer>
              <Image image={image} x={0} y={0} width={spectrogramWidth} height={spectrogramHeight} />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default DevTestPage;
