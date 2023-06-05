import { CLIENT_TYPE_API, CLIENT_TYPE_LOCAL, CLIENT_TYPE_BLOB } from '../Models';
import { ApiClient } from './ApiClient';
import { BlobClient } from './BlobClient';
import { LocalClient } from './LocalClient';
import { IQDataClient } from './IQDataClient';

export const IQDataClientFactory = (type: string): IQDataClient => {
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
