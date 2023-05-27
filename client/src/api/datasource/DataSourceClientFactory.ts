import { LocalClient } from './LocalClient';
import { ApiClient } from './ApiClient';
import { BlobClient } from './BlobClient';
import { CLIENT_TYPE_API, CLIENT_TYPE_BLOB, CLIENT_TYPE_LOCAL, DataSourceClient } from './DataSourceClient';

export const DataSourceClientFactory = (type: string): DataSourceClient => {
  switch (type) {
    case CLIENT_TYPE_API:
      return new ApiClient();
    case CLIENT_TYPE_LOCAL:
      return new LocalClient();
    case CLIENT_TYPE_BLOB:
      return new BlobClient();
    default:
      throw new Error(`Unknown data source type: ${type}`);
  }
};
