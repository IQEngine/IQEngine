import { Layer, Image, Stage } from 'react-konva';
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

export const DevTestPage = () => {
  const [image, setImage] = useState(null);
  const { type, account, container, filePath, sasToken } = useParams();
  const [spectrogramHeight, setSpectrogramHeight] = useState(800);
  const [spectrogramWidth, setSpectrogramWidth] = useState(1000);

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
