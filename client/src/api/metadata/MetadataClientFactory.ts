import { CLIENT_TYPE_API, CLIENT_TYPE_LOCAL, CLIENT_TYPE_BLOB, DataSource } from '@/api/Models';
import { ApiClient } from './ApiClient';
import { BlobClient } from './BlobClient';
import { LocalClient } from './LocalClient';
import { MetadataClient } from './MetadataClient';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';

export const MetadataClientFactory = (type: string, files: FileWithDirectoryAndFileHandle[], dataSources: Record<string, DataSource>): MetadataClient => {
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
