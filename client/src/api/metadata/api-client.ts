import axios from 'axios';
import { MetadataClient } from './metadata-client';
import { SigMFMetadata, Annotation, CaptureSegment, Track } from '@/utils/sigmfMetadata';

export class ApiClient implements MetadataClient {
  async getMeta(account: string, container: string, filePath: string): Promise<SigMFMetadata> {
    const response = await axios.get(`/api/datasources/${account}/${container}/${filePath}/meta`);
    let responseMetaData: SigMFMetadata | null = null;
    responseMetaData = Object.assign(new SigMFMetadata(), response.data);
    responseMetaData.annotations = responseMetaData.annotations?.map((annotation) =>
      Object.assign(new Annotation(), annotation)
    );
    responseMetaData.captures = responseMetaData.captures?.map((capture) =>
      Object.assign(new CaptureSegment(), capture)
    );
    return responseMetaData;
  }

  async getDataSourceMetaPaths(account: string, container: string): Promise<string[]> {
    const response = await axios.get(`/api/datasources/${account}/${container}/meta/paths`);
    return response.data;
  }

  async updateMeta(account: string, container: string, filePath: string, meta: SigMFMetadata): Promise<SigMFMetadata> {
    return await axios
      .put(`/api/datasources/${account}/${container}/${filePath}/meta`, meta)
      .then((response) => {
        return Promise.resolve(meta as SigMFMetadata);
      })
      .catch((error) => {
        console.error(error);
        throw new Error('Failed to update metadata.');
      });
  }

  async track(account: string, container: string, filepath: string, signal: AbortSignal): Promise<Track> {
    if (!account || !container || !filepath) {
      return null;
    }
    const response = await axios.get(`/api/datasources/${account}/${container}/${filepath}/track`, { signal });
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
    if (!response.data) {
      return null;
    }
    return response.data.iqengine_geotrack.coordinates.map((coord) => {
      if (coord.length < 3) {
        return [];
      }
      return [coord[1], coord[0]];
    });

  }

  async queryMeta(queryString: string): Promise<SigMFMetadata[]> {
    const response = await axios.get(`/api/datasources/query?${queryString}`);
    return response.data.map((item, i) => {
      item = Object.assign(new SigMFMetadata(), item);
      item.annotations = item.annotations?.map((annotation) => Object.assign(new Annotation(), annotation));
      item.captures = item.captures?.map((capture) => Object.assign(new CaptureSegment(), capture));
      return item;
    });
  }

  features() {
    return {
      canUpdateMeta: true,
    };
  }
}
