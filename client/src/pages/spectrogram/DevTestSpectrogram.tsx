import { Layer, Image, Stage } from 'react-konva';
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { range } from '@/utils/selector';
import { useGetImage } from '@/api/metadata/DevTestSpectrogram';

export const DevTestPage = () => {
  const [image, setImage] = useState(null);
  const { type, account, container, filePath } = useParams();

  const [fftSize, setFFTSize] = useState(1024);
  const [handleTop, setHandleTop] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [spectrogramHeight, setSpectrogramHeight] = useState(800);
  const [spectrogramWidth, setSpectrogramWidth] = useState(1000);

  const { tiles, iqRaw } = useGetImage(
    type,
    account,
    container,
    filePath,
    fftSize,
    handleTop,
    zoomLevel,
    spectrogramHeight
  );
  return (
    <div className="block">
      <div className="flex flex-col pl-3">
        <div> {tiles} </div>
        <div> {Object.keys(iqRaw).length} </div>
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
