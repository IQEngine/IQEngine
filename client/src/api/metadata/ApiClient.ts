import axios from 'axios';
import { MetadataClient } from './MetadataClient';
import { SigMFMetadata, Annotation, CaptureSegment } from '@/utils/sigmfMetadata';

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

  async getDataSourceMeta(account: string, container: string): Promise<SigMFMetadata[]> {
    const response = await axios.get(`/api/datasources/${account}/${container}/meta`);
    let objectFromJson = response.data;
    let responseMetaData: SigMFMetadata[] = objectFromJson.map((meta) => {
      let newMeta = Object.assign(new SigMFMetadata(), meta);
      newMeta.annotations = newMeta.annotations?.map((annotation) => Object.assign(new Annotation(), annotation));
      newMeta.captures = newMeta.captures?.map((capture) => Object.assign(new CaptureSegment(), capture));
      return newMeta;
    });
    return responseMetaData;
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

  features() {
    return {
      canUpdateMeta: true,
    };
  }
}
