import { DataSourceClientFactory } from './datasource-client-factory';
import { DataSourceClient } from './datasource-client';
import { DataSource } from '@/api/Models';
import { TraceabilityOrigin } from '@/utils/sigmfMetadata';
import { useUserSettings } from '@/api/user-settings/use-user-settings';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMsal } from '@azure/msal-react';
import { ClientType } from '@/api/Models';
import { BlockBlobClient } from '@azure/storage-blob';
import { FileWithHandle, fileOpen } from 'browser-fs-access';

const fetchDataSources = async (client: DataSourceClient) => {
  let response;
  try {
    response = await client.list();
  } catch (error) {
    console.error('the failed GET above is due to no connection to the backend API');
    response = [];
  }
  return response;
};

export const fetchDataSource = async (client: DataSourceClient, account: string, container: string) => {
  const response = await client.get(account, container);
  return response;
};

const fetchSasToken = async (client: DataSourceClient, account: string, container: string, filepath: string, write: boolean = false) => {
  const response = await client.getSasToken(account, container, filepath, write);
  return response;
};

export const getDataSources = (type: string, enabled = true) => {
  const { filesQuery, dataSourcesQuery } = useUserSettings();
  const { instance } = useMsal();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return useQuery(['datasource', type], () => fetchDataSources(client), {
    enabled: enabled,
  });
};

export const getDataSource = (type: string, account: string, container: string, enabled = true) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return useQuery(
    ['datasource', type, account, container],
    () => {
      return fetchDataSource(client, account, container);
    },
    {
      enabled: enabled,
    }
  );
};

export const useSasToken = (type: string, account: string, container: string, filepath: string, write: boolean = false, enabled = true) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);

  return useQuery(
    ['sas', type, account, container, filepath, write],
    () => {
      return fetchSasToken(client, account, container, filepath, write);
    },
    {
      enabled: enabled,
    }
  );
};

export const useQueryMeta = (type: string, queryString: string, enabled = true) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return useQuery<TraceabilityOrigin[]>(
    ['metadata-query', queryString],
    async ({ signal }) => {
      return await client.query(queryString, signal);
    },
    {
      enabled: enabled,
    }
  );
};

export const useGetDatasourceFeatures = (type: string) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return client.features();
};

export const useSyncDataSource = (type: string, account: string, container) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return () => client.sync(account, container);
};

export const useGetDataSource = (type: string, account: string, container: string) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const client = DataSourceClientFactory(type, filesQuery.data, dataSourcesQuery.data, instance);
  return () => client.get(account, container);
};

export const useAddDataSource = () => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const dataSourceClient = DataSourceClientFactory(ClientType.API, filesQuery.data, dataSourcesQuery.data, instance);

  return useMutation({
    mutationFn: (dataSource: DataSource) => {
      let response = dataSourceClient.create(dataSource);
      return response;
    },
    onError: (err, newMeta, context) => {
      console.error('onError', err);
    },
  });
};

export const useUpdateDataSource = () => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const dataSourceClient = DataSourceClientFactory(ClientType.API, filesQuery.data, dataSourcesQuery.data, instance);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dataSource: DataSource) => {
      let response = dataSourceClient.update(dataSource);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['datasource', ClientType.API]);
    },
    onError: (err, newMeta, context) => {
      console.error('onError', err);
    },
  });
};

export const useUploadDataSource = (type: string, account: string, container: string, setProgress) => {
  const { dataSourcesQuery, filesQuery } = useUserSettings();
  const { instance } = useMsal();
  const dataSourceClient = DataSourceClientFactory(ClientType.API, filesQuery.data, dataSourcesQuery.data, instance);

  async function uploadBlob(f:FileWithHandle, account, container) {
    // Create azure blob client
    const blobName = f.name;
    const sas_token = await fetchSasToken(dataSourceClient, account, container, blobName, true); // Note - it needs ADD, CREATE, WRITE
    const blobUrl = `https://${account}.blob.core.windows.net/${container}/${blobName}?${sas_token.data.sasToken}`;

    const blockBlobClient = new BlockBlobClient(blobUrl);

    // chunking related
    const blockSize = 1 * 1024 * 1024; // 1MB
    const blockCount = Math.ceil(f.size / blockSize);
    console.log(blockCount, 'blocks');
    const blockIds = [];
    for (let i = 0; i < blockCount; i++) {
      setProgress((i / blockCount) * 100); // update progress bar
      const start = i * blockSize;
      const end = Math.min(start + blockSize, f.size);
      const chunk = f.slice(start, end);
      const chunkSize = end - start;
      const blockId = btoa('block-' + i.toString().padStart(6, '0'));
      blockIds.push(blockId);
      await blockBlobClient.stageBlock(blockId, chunk, chunkSize);
    }
    await blockBlobClient.commitBlockList(blockIds);
    setProgress(100);

  }

  const uploadFiles = async () => {
    const files = await fileOpen({
      multiple: true,
    });
    let uploadedFilesList = [];
    for (let indx in files) {
      await uploadBlob(files[indx], account, container);
      uploadedFilesList = uploadedFilesList.concat(files[indx].name);
    }
    setProgress(0);
  };

  // Upload files with progress bar
  return uploadFiles;
};
