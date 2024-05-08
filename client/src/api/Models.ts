import { Annotation, TraceabilityOrigin } from '@/utils/sigmfMetadata';

export interface DataSource {
  type: string;
  name: string;
  description?: string;
  imageURL?: string;
  account: string;
  container: string;
  sasToken?: string;
  accountKey?: string;
  owners?: string[];
  readers?: string[];
  public?: boolean;
}

export interface SmartQueryResult {
  parameters: object;
  results: TraceabilityOrigin[];
}

export interface IQDataSlice {
  index: number;
  iqArray: Float32Array;
}

export interface PluginDefinition {
  name: string;
  url: string;
}

export class PluginEndpoint {
  name: string;
  url: string;
  plugins: {
    [key: string]: PluginParameters;
  };
}

export class PluginParameters {
  [key: string]: {
    title: string;
    type: string;
    default: any;
    value?: any;
  };
}

export class UserDefinition {
  id: string;
  displayName: string;
  memberOf: GroupDefinition[];
}

export class GroupDefinition {
  id: string;
  displayName: string;
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

export enum ClientType {
  API = 'api',
  LOCAL = 'local',
  BLOB = 'azure_blob',
}

export interface JobStatus {
  job_id: string;
  file_name: string;
  function_name: string;
  progress: number;
  error?: string | null;
}

export enum DataType {
  iq_ci8_le = 'iq/ci8_le',
  iq_ci16_le = 'iq/ci16_le',
  iq_cf32_le = 'iq/cf32_le',
  image_png = 'image/png',
  audio_wav = 'audio/wav',
  application_octet_stream = 'application/octet-stream',
  text_plain = 'text/plain',
}
export interface MetadataFile {
  file_name: string;
  data_type: DataType;
  sample_rate: number;
  center_freq: number;
}
interface IDictionary<TValue> {
  [id: string]: TValue;
}
export interface RunPluginBody {
  start_plugin: boolean;
  metadata_file: MetadataFile;
  iq_file: File;
  custom_params: IDictionary<any>;
}

export interface JobOutput {
  job_status?: JobStatus;
  metadata_file?: MetadataFile;
  metadata_cloud?: any;
  additionalProperties?: { [key: string]: string | number | boolean };
  annotations?: Annotation[];
  output_data?: string;
  non_iq_output_data?: DataObject;
}

export interface DataObject {
  data_type?: DataType;
  file_name?: string;
  data: string;
}

export const CLIENT_TYPE_API = 'api';
export const CLIENT_TYPE_LOCAL = 'local';
export const CLIENT_TYPE_BLOB = 'azure_blob';
