import { Layer, Image, Stage } from 'react-konva';
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useGetImage } from '@/hooks/use-get-image';

export const DevTestPage = () => {
  const [image, setImage] = useState(null);
  const { type, account, container, filePath } = useParams();

  const [fftSize, setFFTSize] = useState(1024);
  const [handleTop, setHandleTop] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [spectrogramHeight, setSpectrogramHeight] = useState(800);
  const [spectrogramWidth, setSpectrogramWidth] = useState(1000);
  const [iqRaw, setIQRaw] = useState<Record<number, Float32Array>>({});

  const { tiles, iqQuery } = useGetImage(
    type,
    account,
    container,
    filePath,
    fftSize,
    handleTop,
    zoomLevel,
    spectrogramHeight
  );

  useEffect(() => {
    let data = iqQuery
      .map((slice) => slice.data)
      .filter((data) => data !== null)
      .reduce((acc, data) => {
        if (!data || !!iqRaw[data.index]) {
          return acc;
        }
        acc[data.index] = data.iqArray;
        return acc;
      }, {});
    setIQRaw((oldData) => {
      return { ...oldData, ...data };
    });
  }, [iqQuery.reduce((previous, current) => previous + current.dataUpdatedAt, '')]);

  return (
    <div className="block">
      <div className="flex flex-col pl-3">
        <div> {tiles} </div>
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
