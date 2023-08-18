import { CLIENT_TYPE_API, CLIENT_TYPE_LOCAL, CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { ApiClient } from './api-client';
import { BlobClient } from './blob-client';
import { LocalClient } from './local-client';
import { MetadataClient } from './metadata-client';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { IPublicClientApplication } from '@azure/msal-browser';

export const MetadataClientFactory = (
  type: string,
  files: FileWithDirectoryAndFileHandle[],
  dataSources: Record<string, DataSource>,
  instance: IPublicClientApplication,
): MetadataClient => {
  switch (type) {
    case CLIENT_TYPE_API:{
      let accounts = [];
      if (instance) {
        accounts = instance.getAllAccounts();
      }
      if (accounts.length === 0) {
        return new ApiClient(null, null);
      } else {
        return new ApiClient(instance, accounts[0]);
      }
    }
    case CLIENT_TYPE_LOCAL:
      return new LocalClient(files);
    case CLIENT_TYPE_BLOB:
      return new BlobClient(dataSources);
    default:
      throw new Error(`Unknown data source type: ${type}`);
  }
};
