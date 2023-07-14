import { getMeta } from '@/api/metadata/Queries';
import { range, calculateTileNumbers } from '@/utils/selector';
import React, { useState, useCallback } from 'react';
import { getIQDataSlices } from '@/api/iqdata/Queries';
import { TILE_SIZE_IN_IQ_SAMPLES } from '@/utils/constants';

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

  // const iqQuery = getIQDataSlices(meta, tiles, TILE_SIZE_IN_IQ_SAMPLES, !!meta && tiles.length > 0);

  // const tileData = useCallback(() => {
  //   let data = iqQuery
  //     .map((slice) => slice.data)
  //     .filter((data) => data !== null)
  //     .reduce((acc, data) => {
  //       if (!data || !!iqRaw[data.index]) {
  //         return acc;
  //       }
  //       acc[data.index] = data.iqArray;
  //       return acc;
  //     }, {});
  //   setIQRaw((oldData) => {
  //     return { ...oldData, ...data };
  //   });
  // }, [iqQuery.reduce((previous, current) => previous + current.dataUpdatedAt, '')]);

  // const ret = JSON.stringify(Object.keys(iqRaw).length);
  return { tiles, iqRaw };
};
