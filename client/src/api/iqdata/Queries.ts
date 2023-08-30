import { useQuery, useQueryClient } from '@tanstack/react-query';
import { IQDataClientFactory } from './IQDataClientFactory';
import { INITIAL_PYTHON_SNIPPET } from '@/utils/constants';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMeta } from '@/api/metadata/queries';
import { useMsal } from '@azure/msal-react';
import { applyProcessing } from '@/utils/fetch-more-data-source';
import { groupContiguousIndexes } from '@/utils/group';

declare global {
  interface Window {
    loadPyodide: any;
  }
}

const MAXIMUM_SAMPLES_PER_REQUEST = 1024 * 256;

export function useDataCacheFunctions(
  type: string,
  account: string,
  container: string,
  filePath: string,
  fftSize: number
) {
  const queryClient = useQueryClient();
  function clearIQData() {
    queryClient.removeQueries(['iqData', type, account, container, filePath, fftSize]);
    queryClient.removeQueries(['rawiqdata', type, account, container, filePath, fftSize]);
    queryClient.removeQueries(['processedIQData', type, account, container, filePath, fftSize]);
  }
  return {
    clearIQData,
  };
}

export function useGetIQData(
  type: string,
  account: string,
  container: string,
  filePath: string,
  fftSize: number,
  taps: number[] = [1],
  pythonScript: string = INITIAL_PYTHON_SNIPPET,
  fftStepSize: number = 0
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
    if (!pyodide && pythonScript && pythonScript !== INITIAL_PYTHON_SNIPPET && fftStepSize === 0) {
      initPyodide().then((pyodide) => {
        setPyodide(pyodide);
      });
    }
  }, [pythonScript, fftStepSize]);

  const queryClient = useQueryClient();
  const { filesQuery, dataSourcesQuery } = useUserSettings();
  const [fftsRequired, setStateFFTsRequired] = useState<number[]>([]);

  // enforce MAXIMUM_SAMPLES_PER_REQUEST by truncating if need be
  function setFFTsRequired(fftsRequired: number[]) {
    fftsRequired = fftsRequired.slice(
      0,
      fftsRequired.length > Math.ceil(MAXIMUM_SAMPLES_PER_REQUEST / fftSize)
        ? Math.ceil(MAXIMUM_SAMPLES_PER_REQUEST / fftSize)
        : fftsRequired.length
    );
    setStateFFTsRequired(fftsRequired);
  }

  const { data: meta } = useMeta(type, account, container, filePath);

  const { instance } = useMsal();

  const iqDataClient = IQDataClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);

  // fetches iqData, this happens first, and the iqData is in one big continuous chunk
  const { data: iqData } = useQuery({
    queryKey: ['iqData', type, account, container, filePath, fftSize, fftsRequired],
    queryFn: async ({ signal }) => {
      const iqData = await iqDataClient.getIQDataBlocks(meta, fftsRequired, fftSize, signal);
      return iqData;
    },
    enabled: !!meta && !!filesQuery.data && !!dataSourcesQuery.data,
  });

  // This sets rawiqdata, rawiqdata contains all the data, while the iqData above is just the recently fetched one
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

  // fetches rawiqdata
  const { data: processedIQData, dataUpdatedAt: processedDataUpdated } = useQuery<number[][]>({
    queryKey: ['rawiqdata', type, account, container, filePath, fftSize],
    queryFn: async () => {
      return [];
    },
    select: useCallback(
      (data) => {
        if (!data) {
          return [];
        }
        // performance.mark('start');
        let currentProcessedData = queryClient.getQueryData<number[][]>([
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

        if (!currentProcessedData) {
          currentProcessedData = [];
        }
        let currentIndexes = data.map((_, i) => i);
        // remove any data that have already being processed
        const dataRange = currentIndexes.filter((index) => !currentProcessedData[index]);

        groupContiguousIndexes(dataRange).forEach((group) => {
          const iqData = data.slice(group.start, group.start + group.count);
          const iqDataFloatArray = new Float32Array((iqData.length + 1) * fftSize);
          iqData.forEach((data, index) => {
            iqDataFloatArray.set(data, index * fftSize);
          });
          const result = applyProcessing(iqDataFloatArray, taps, pythonScript, pyodide);

          for (let i = 0; i < group.count; i++) {
            currentProcessedData[group.start + i] = result.slice(i * fftSize, (i + 1) * fftSize);
          }
        });
        // performance.mark('end');
        // const performanceMeasure = performance.measure('processing', 'start', 'end');
        queryClient.setQueryData(
          ['processedIQData', type, account, container, filePath, fftSize, taps, pythonScript, !!pyodide],
          currentProcessedData
        );

        return currentProcessedData;
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

export function useGetMinimapIQ(type: string, account: string, container: string, filePath: string, enabled = true) {
  const { data: meta } = useMeta(type, account, container, filePath);
  const { filesQuery, dataSourcesQuery } = useUserSettings();
  const { instance } = useMsal();
  const iqDataClient = IQDataClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  const minimapQuery = useQuery<Float32Array[]>({
    queryKey: ['minimapiq', type, account, container, filePath],
    queryFn: async ({ signal }) => {
      const minimapIQ = await iqDataClient.getMinimapIQ(meta, signal);
      return minimapIQ;
    },
    enabled: enabled && !!meta && !!filesQuery.data && !!dataSourcesQuery.data,
  });
  return minimapQuery;
}
