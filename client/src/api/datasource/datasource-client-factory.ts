import { LocalClient } from './local-client';
import { ApiClient } from './api-client';
import { BlobClient } from './blob-client';
import { DataSourceClient } from './datasource-client';
import { CLIENT_TYPE_API, CLIENT_TYPE_LOCAL, CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';

export const DataSourceClientFactory = (
  type: string,
  files: FileWithDirectoryAndFileHandle[],
  dataSources: Record<string, DataSource>
): DataSourceClient => {
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
