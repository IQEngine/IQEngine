// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React, { useState, useEffect } from 'react';
import { Image } from 'react-konva';
import { selectFft, SelectFftReturn } from '@/utils/selector';
import { SigMFMetadata } from '@/utils/sigmfMetadata';

interface FFTImageClientProps {
  spectrogramWidth: number;
  spectrogramHeight: number;
  meta: SigMFMetadata;
  lowerTile: number;
  upperTile: number;
  fftSize: number;
  magnitudeMax: number;
  magnitudeMin: number;
  fftWindow: string;
  zoomLevel: number;
  iqData: Record<number, Float32Array>;
  colorMap: any;
  setFetchMinimap: (fetch: boolean) => void;
  fftData: Record<number, Float32Array>;
  setFFTData: (data: Record<number, Float32Array>) => void;
}

const FFTImageClient = ({
  spectrogramWidth,
  spectrogramHeight,
  meta,
  lowerTile,
  upperTile,
  fftSize,
  magnitudeMax,
  magnitudeMin,
  fftWindow,
  zoomLevel,
  iqData,
  colorMap,
  setFetchMinimap,
  fftData,
  setFFTData,
}: FFTImageClientProps) => {
  // FFT Properties
  const [image, setImage] = useState(null);
  const [fftImage, setFFTImage] = useState<SelectFftReturn>(null);
  const [missingTiles, setMissingTiles] = useState([]);

  useEffect(() => {
    if (!meta || lowerTile < 0 || upperTile < 0) {
      return;
    }
    console.debug('FFT Changed');
    const ret = selectFft(
      lowerTile,
      upperTile,
      fftSize,
      magnitudeMax,
      magnitudeMin,
      meta,
      fftWindow, // dont want to conflict with the main window var
      zoomLevel,
      iqData,
      {},
      colorMap
    );
    setFFTData(ret?.fftData);
    setFFTImage(ret);
  }, [fftSize, magnitudeMax, magnitudeMin, fftWindow, zoomLevel, colorMap]);

  useEffect(() => {
    if (!meta || lowerTile < 0 || upperTile < 0) {
      return;
    }
    console.debug('FFT Repositioned');
    const ret = selectFft(
      lowerTile,
      upperTile,
      fftSize,
      magnitudeMax,
      magnitudeMin,
      meta,
      fftWindow, // dont want to conflict with the main window var
      zoomLevel,
      iqData,
      fftData,
      colorMap
    );
    setFFTData(ret?.fftData);
    setFFTImage(ret);
  }, [lowerTile, upperTile, missingTiles.length, iqData]);

  const renderImage = async () => {
    if (!fftImage) {
      return;
    }
    createImageBitmap(fftImage.imageData).then((imageBitmap) => {
      setImage(imageBitmap);
    });
    setMissingTiles(fftImage.missingTiles);
    setFetchMinimap(true);
  };

  useEffect(() => {
    renderImage();
  }, [fftImage]);

  return <Image image={image} x={0} y={0} width={spectrogramWidth} height={spectrogramHeight} />;
};

export { FFTImageClient };
