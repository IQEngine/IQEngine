import { LocalClient } from './LocalClient';
import { ApiClient } from './ApiClient';
import { BlobClient } from './BlobClient';
import { DataSourceClient } from './DataSourceClient';
import { CLIENT_TYPE_API, CLIENT_TYPE_LOCAL, CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';

export const DataSourceClientFactory = (type: string, files: FileWithDirectoryAndFileHandle[], dataSources: Record<string, DataSource>): DataSourceClient => {
  switch (type) {
    case CLIENT_TYPE_API:
      return new ApiClient();
    case CLIENT_TYPE_LOCAL:
      return new LocalClient(files);
    case CLIENT_TYPE_BLOB:
      return new BlobClient(dataSources);
    default:
      throw new Error(`Unknown data source type: ${type}`);
  }
};
