import { Layer, Image, Stage } from 'react-konva';
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getMeta } from '@/api/metadata/Queries';
import { range, calculateTileNumbers } from '@/utils/selector';
import { SigMFMetadata } from '@/utils/sigmfMetadata';

export const DevTestPage = () => {
  const [image, setImage] = useState(null);
  const { type, account, container, filePath } = useParams();
  const { data: meta } = getMeta(type, account, container, filePath);
  //const [meta, setMeta] = useState<SigMFMetadata>(metaQuery.data);

  const [fftSize, setFFTSize] = useState(1024);
  const [handleTop, setHandleTop] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [spectrogramHeight, setSpectrogramHeight] = useState(800);
  const [spectrogramWidth, setSpectrogramWidth] = useState(1000);
  const [upperTile, setUpperTile] = useState(-1);
  const [lowerTile, setLowerTile] = useState(-1);
  const tiles = range(Math.floor(lowerTile), Math.ceil(upperTile));

  const fetchAndRender = (handleTop) => {
    if (!meta) {
      return;
    }
    const calculatedTiles = calculateTileNumbers(
      handleTop,
      meta.getTotalSamples(),
      fftSize,
      spectrogramHeight,
      zoomLevel
    );
    setLowerTile(calculatedTiles.lowerTile);
    setUpperTile(calculatedTiles.upperTile);
    setHandleTop(handleTop);
  };

  useEffect(() => {
    if (meta) {
      console.log('fetching and rendering tiles', meta);
      fetchAndRender(handleTop);
    }
  }, [meta, zoomLevel, handleTop, spectrogramWidth, spectrogramHeight]);

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
