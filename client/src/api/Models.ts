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

export interface PluginDefinition {
  name: string;
  url: string;
}

export interface FFTParams {
  fftSize: number;
  windowFunction: string;
  magnitude_min: number;
  magnitude_max: number;
}

export const DEFAULT_FFT_PARAMETERS: FFTParams = {
  fftSize: 1024,
  windowFunction: 'hamming',
  magnitude_min: -20,
  magnitude_max: 20,
};

export const CLIENT_TYPE_API = 'api';
export const CLIENT_TYPE_LOCAL = 'local';
export const CLIENT_TYPE_BLOB = 'azure_blob';
