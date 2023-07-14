import { getMeta } from '@/api/metadata/Queries';
import { range, calculateTileNumbers } from '@/utils/selector';
import React, { useState, useCallback } from 'react';

export const useGetImage = (
  type: string,
  account: string,
  container: string,
  filePath: string,
  fftSize: number,
  handleTop: number,
  zoomLevel: number,
  spectrogramHeight: number
) => {
  const { data: meta } = getMeta(type, account, container, filePath);
  const [iqRaw, setIQRaw] = useState<Record<number, Float32Array>>({});

  const calculatedTiles = useCallback(() => {
    if (!meta) return { lowerTile: 0, upperTile: 0 };
    return calculateTileNumbers(handleTop, meta.getTotalSamples(), fftSize, spectrogramHeight, zoomLevel);
  }, [handleTop, meta, fftSize, spectrogramHeight, zoomLevel]);

  const { lowerTile, upperTile } = calculatedTiles();
  const tiles = range(Math.floor(lowerTile), Math.ceil(upperTile));

  return { tiles };
};
