import { LocalClient } from './local-client';
import { ApiClient } from './api-client';
import { BlobClient } from './blob-client';
import { DataSourceClient } from './datasource-client';
import { CLIENT_TYPE_API, CLIENT_TYPE_LOCAL, CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { IPublicClientApplication } from '@azure/msal-browser';

export const DataSourceClientFactory = (
  type: string,
  files: FileWithDirectoryAndFileHandle[],
  dataSources: Record<string, DataSource>,
  instance: IPublicClientApplication,
): DataSourceClient => {
  switch (type) {
    case CLIENT_TYPE_API: {
      if (!instance || !instance.getAllAccounts || instance.getAllAccounts().length === 0) {
        return new ApiClient(null, null);
      }
      const accounts = instance.getAllAccounts();
      return new ApiClient(instance, accounts[0]);
    }
    case CLIENT_TYPE_LOCAL:
      return new LocalClient(files);
    case CLIENT_TYPE_BLOB:
      return new BlobClient(dataSources);
    default:
      throw new Error(`Unknown data source type: ${type}`);
  }
};
