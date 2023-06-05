export interface DataSource {
  type: string;
  name: string;
  description?: string;
  imageURL?: string;
  account: string;
  container: string;
  sasToken?: string;
}

export interface IQDataSlice {
  index: number;
  iqArray: Float32Array;
}

export const CLIENT_TYPE_API = 'api';
export const CLIENT_TYPE_LOCAL = 'local';
export const CLIENT_TYPE_BLOB = 'azure_blob';
