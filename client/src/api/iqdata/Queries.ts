import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { IQDataClientFactory } from './IQDataClientFactory';
import { range } from '@/utils/selector';
import { IQDataSlice } from '@/api/Models';
import { TILE_SIZE_IN_IQ_SAMPLES } from '@/utils/constants';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import { useEffect, useMemo, useState } from 'react';
import { useMeta } from '@/api/metadata/queries';

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
  const { filesQuery, dataSourcesQuery } = useUserSettings();

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
    ({ signal }) => {
      const iqDataClient = IQDataClientFactory(type, filesQuery.data, dataSourcesQuery.data);
      return iqDataClient.getIQDataSlice(meta, index, tileSize, signal);
    },
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
  const { filesQuery, dataSourcesQuery } = useUserSettings();
  if (!meta || !indexes || !indexes.length || !filesQuery.data || !dataSourcesQuery.data) {
    return useQuery(['invalidQuery'], () => null);
  }
  const { type, account, container, file_path } = meta.getOrigin();

  return useQuery<IQDataSlice[]>({
    queryKey: ['datasource', type, account, container, file_path, 'iq', { indexes: indexes, tileSize: tileSize }],
    queryFn: ({ signal }) => {
      const iqDataClient = IQDataClientFactory(type, filesQuery.data, dataSourcesQuery.data);
      console.log('getIQDataFullIndexes', indexes, meta, filesQuery.data, dataSourcesQuery.data);
      return iqDataClient.getIQDataSlices(meta, indexes, tileSize, signal);
    },
    enabled: enabled && !!meta && !!filesQuery.data && !!dataSourcesQuery.data,
    staleTime: Infinity,
  });
};

export const getIQDataSlices = (
  meta: SigMFMetadata,
  indexes: number[],
  tileSize: number = TILE_SIZE_IN_IQ_SAMPLES,
  enabled = true
) => {
  const { filesQuery, dataSourcesQuery } = useUserSettings();
  if (!meta || !indexes || !indexes.length || !filesQuery.data || !dataSourcesQuery.data) {
    return useQueries({
      queries: [],
    });
  }
  const { type, account, container, file_path } = meta?.getOrigin();
  return useQueries({
    queries: indexes.map((index) => {
      return {
        queryKey: ['datasource', type, account, container, file_path, 'iq', { index: index, tileSize: tileSize }],
        queryFn: async () => {
          const signal = new AbortController().signal;
          const iqDataClient = IQDataClientFactory(type, filesQuery.data, dataSourcesQuery.data);
          return iqDataClient.getIQDataSlice(meta, index, tileSize, signal);
        },
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
      if (!slice || !slice[0] || !slice[0].length) {
        console.log('slice is null');
        return null;
      }
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

export function useGetIQData(
  type: string,
  account: string,
  container: string,
  filePath: string,
  defaultFFTSize: number = 1024
) {
  const queryClient = useQueryClient();
  const { filesQuery, dataSourcesQuery } = useUserSettings();
  const [fftSize, setFFTSize] = useState<number>(defaultFFTSize);
  const [fftsRequired, setFFTsRequired] = useState<number[]>([]);

  const { data: meta } = useMeta(type, account, container, filePath);

  const { data: iqData } = useQuery({
    queryKey: ['iqData', type, account, container, filePath, fftSize, fftsRequired],
    queryFn: async ({ signal }) => {
      const iqDataClient = IQDataClientFactory(type, filesQuery.data, dataSourcesQuery.data);
      const iqData = await iqDataClient.getIQDataBlocks(meta, fftsRequired, fftSize, signal);
      return iqData;
    },
    enabled: !!meta && !!filesQuery.data && !!dataSourcesQuery.data,
  });

  const currentData = useMemo(() => {
    if (!meta) {
      return null;
    }
    if (iqData) {
      // change iqdata to be an sparce array with the index as the key
      const tempArray = [];
      iqData.forEach((data) => {
        tempArray[data.index] = data.iqArray;
      });
      const previousData = queryClient.getQueryData<Float32Array[]>([
        'rawiqdata',
        type,
        account,
        container,
        filePath,
        fftSize,
      ]);
      // This is the fastest way to merge the two sparce arrays keeping the indexes in order
      const content = Object.assign([], previousData, tempArray);
      queryClient.setQueryData(['rawiqdata', type, account, container, filePath, fftSize], content);
    }
    const content = queryClient.getQueryData<Float32Array[]>([
      'rawiqdata',
      type,
      account,
      container,
      filePath,
      fftSize,
    ]);
    if (!content) {
      return null;
    }
    return content;
  }, [fftSize, meta, iqData]);
  return {
    fftSize,
    setFFTSize,
    currentData,
    fftsRequired,
    setFFTsRequired,
  };
}
