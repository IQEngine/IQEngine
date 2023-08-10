import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { IQDataClientFactory } from './IQDataClientFactory';
import { INITIAL_PYTHON_SNIPPET, TILE_SIZE_IN_IQ_SAMPLES } from '@/utils/constants';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMeta } from '@/api/metadata/queries';
import { applyProcessing } from '@/utils/fetch-more-data-source';

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

declare global {
  interface Window {
    loadPyodide: any;
  }
}

export function useGetIQData(
  type: string,
  account: string,
  container: string,
  filePath: string,
  fftSize: number,
  taps: number[] = [1],
  pythonScript: string = INITIAL_PYTHON_SNIPPET
) {
  const [pyodide, setPyodide] = useState<any>(null);

  async function initPyodide() {
    console.log('Loading pyodide...');
    const pyodide = await window.loadPyodide();
    await pyodide.loadPackage('numpy');
    await pyodide.loadPackage('matplotlib');
    return pyodide;
  }

  useEffect(() => {
    if (!pyodide && pythonScript && pythonScript !== INITIAL_PYTHON_SNIPPET) {
      initPyodide().then((pyodide) => {
        setPyodide(pyodide);
      });
    }
  }, [pythonScript]);

  const queryClient = useQueryClient();
  const { filesQuery, dataSourcesQuery } = useUserSettings();
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

  useEffect(() => {
    if (iqData) {
      const previousData = queryClient.getQueryData<Float32Array[]>([
        'rawiqdata',
        type,
        account,
        container,
        filePath,
        fftSize,
      ]);
      const sparseIQReturnData = [];
      iqData.forEach((data) => {
        sparseIQReturnData[data.index] = data.iqArray;
      });
      const content = Object.assign([], previousData, sparseIQReturnData);
      queryClient.setQueryData(['rawiqdata', type, account, container, filePath, fftSize], content);
    }
  }, [iqData, fftSize]);

  const { data: processedIQData, dataUpdatedAt: processedDataUpdated } = useQuery<Float32Array[]>({
    queryKey: ['rawiqdata', type, account, container, filePath, fftSize],
    queryFn: async () => {
      return null;
    },
    select: useCallback(
      (data) => {
        if (!data) {
          return null;
        }
        performance.mark('start');
        const currentProcessedData = queryClient.getQueryData<number[][]>([
          'processedIQData',
          type,
          account,
          container,
          filePath,
          fftSize,
          taps,
          pythonScript,
          !!pyodide,
        ]);
        const processedData = data.map((iqData: Float32Array, i: number) => {
          if (currentProcessedData && currentProcessedData[i]) {
            return currentProcessedData[i];
          }
          return applyProcessing(iqData, taps, pythonScript, pyodide);
        });
        performance.mark('end');
        const performanceMeasure = performance.measure('processing', 'start', 'end');
        queryClient.setQueryData(
          ['processedIQData', type, account, container, filePath, fftSize, taps, pythonScript, !!pyodide],
          processedData
        );

        return processedData;
      },
      [!!pyodide, pythonScript, taps.join(',')]
    ),
    enabled: !!meta && !!filesQuery.data && !!dataSourcesQuery.data,
  });

  const currentData = processedIQData;

  return {
    fftSize,
    currentData,
    fftsRequired,
    setFFTsRequired,
    processedDataUpdated,
  };
}

export function useRawIQData(type, account, container, filePath, fftSize) {
  const rawIQQuery = useQuery<Float32Array[]>({
    queryKey: ['rawiqdata', type, account, container, filePath, fftSize],
    queryFn: async () => null,
  });
  const downloadedIndexes = useMemo<number[]>(() => {
    if (!rawIQQuery.data) {
      return [];
    }
    // get all the array positions that have any data without use of reduce
    const downloadedIndexes = [];
    rawIQQuery.data.forEach((data, index) => {
      if (data) {
        downloadedIndexes.push(index);
      }
    });
    return downloadedIndexes;
  }, [rawIQQuery.data]);
  return {
    downloadedIndexes,
    rawIQQuery,
  };
}
