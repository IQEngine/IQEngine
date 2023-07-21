import { Layer, Image, Stage } from 'react-konva';
import React, { useState } from 'react';
import { useGetImage } from '@/pages/spectrogram/hooks/use-get-image';
import { COLORMAP_DEFAULT } from '@/utils/constants';

export const DevTestPage = () => {
  const [spectrogramHeight, setSpectrogramHeight] = useState(800);
  const [spectrogramWidth, setSpectrogramWidth] = useState(1000);
  const fftSize = 1024;
  const magnitudeMin = -40.0;
  const magnitudeMax = -10.0;

  let { image } = useGetImage(fftSize, spectrogramHeight, magnitudeMin, magnitudeMax, COLORMAP_DEFAULT, 'hamming');
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
