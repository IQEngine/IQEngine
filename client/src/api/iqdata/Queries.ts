import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { IQDataClientFactory } from './IQDataClientFactory';
import { range } from '@/utils/selector';
import { IQDataSlice } from '@/api/Models';
import { TILE_SIZE_IN_IQ_SAMPLES } from '@/utils/constants';

export const getIQDataSlice = (
  meta: SigMFMetadata,
  index: number,
  tileSize: number = TILE_SIZE_IN_IQ_SAMPLES,
  enabled = true
) => {
  if (!meta) {
    return useQuery(['invalidQuery'], () => null);
  }
  const { type, account, container, file_path } = meta.getOrigin();
  const client = IQDataClientFactory(type);
  return useQuery(
    [
      'datasource',
      type,
      account,
      container,
      file_path,
      'iq',
      {
        index: index,
        tileSize: tileSize,
      },
    ],
    () => client.getIQDataSlice(meta, index, tileSize),
    {
      enabled: enabled && !!meta,
      staleTime: Infinity,
    }
  );
};

export const getIQDataSliceRange = (
  meta: SigMFMetadata,
  start: number,
  end: number,
  tileSize: number = TILE_SIZE_IN_IQ_SAMPLES,
  enabled = true
) => {
  if (!meta || start > end || start < 0 || end < 0) {
    return useQueries({
      queries: [],
    });
  }
  const indexes = range(Math.floor(start), Math.ceil(end));
  return getIQDataSlices(meta, indexes, tileSize, enabled);
};

export const getIQDataFullIndexes = (
  meta: SigMFMetadata,
  indexes: number[],
  tileSize: number = TILE_SIZE_IN_IQ_SAMPLES,
  enabled = true
) => {
  if (!meta) {
    return useQuery<IQDataSlice[]>({
      queryKey: ['invalidQuery'],
      queryFn: () => null,
    });
  }
  const { type, account, container, file_path } = meta.getOrigin();
  const client = IQDataClientFactory(type);
  return useQuery<IQDataSlice[]>({
    queryKey: ['datasource', type, account, container, file_path, 'iq', { indexes: indexes, tileSize: tileSize }],
    queryFn: () => client.getIQDataSlices(meta, indexes, tileSize),
    enabled: enabled && !!meta,
    staleTime: Infinity,
  });
};

export const getIQDataSlices = (
  meta: SigMFMetadata,
  indexes: number[],
  tileSize: number = TILE_SIZE_IN_IQ_SAMPLES,
  enabled = true
) => {
  if (!meta || !indexes || indexes.length === 0) {
    return useQueries({
      queries: [],
    });
  }
  const { type, account, container, file_path } = meta?.getOrigin();
  const client = IQDataClientFactory(type);
  return useQueries({
    queries: indexes.map((index) => {
      return {
        queryKey: ['datasource', type, account, container, file_path, 'iq', { index: index, tileSize: tileSize }],
        queryFn: () => client.getIQDataSlice(meta, index, tileSize),
        enabled: enabled && !!meta && index >= 0,
        staleTime: Infinity,
      };
    }),
  });
};

export const useCurrentCachedIQDataSlice = (meta: SigMFMetadata, tileSize: number = TILE_SIZE_IN_IQ_SAMPLES) => {
  if (!meta) {
    return {
      downloadedTiles: [],
    };
  }
  const queryClient = useQueryClient();
  const { type, account, container, file_path: filePath } = meta.getOrigin();
  const downloadedTiles = queryClient
    .getQueriesData(['datasource', type, account, container, filePath, 'iq'])
    .map((slice) => {
      let queryData = slice[0][slice[0].length - 1] as { tileSize: number; index: number };
      if (queryData && queryData.tileSize === tileSize) {
        return queryData.index;
      } else {
        return null;
      }
    })
    .filter((tile) => tile !== null);
  return {
    downloadedTiles: downloadedTiles,
  };
};
