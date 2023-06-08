import axios from 'axios';
import { MetadataClient } from './MetadataClient';
import { SigMFMetadata, Annotation, CaptureSegment } from '@/Utils/sigmfMetadata';

export class ApiClient implements MetadataClient {
  async getMeta(account: string, container: string, filePath: string): Promise<SigMFMetadata> {
    const response = await axios.get(`/api/datasources/${account}/${container}/${filePath}`);
    let responseMetaData: SigMFMetadata | null = null;
    responseMetaData = Object.assign(new SigMFMetadata(), response.data);
    responseMetaData.annotations = responseMetaData.annotations.map((annotation) =>
      Object.assign(new Annotation(), annotation)
    );
    responseMetaData.captures = responseMetaData.captures.map((capture) =>
      Object.assign(new CaptureSegment(), capture)
    );
    return responseMetaData;
  }

  async getDataSourceMeta(account: string, container: string): Promise<SigMFMetadata[]> {
    const response = await axios.get(`/api/datasources/${account}/${container}/meta`);
    let objectFromJson = response.data;
    let responseMetaData: SigMFMetadata[] = objectFromJson.map((meta) => {
      let newMeta = Object.assign(new SigMFMetadata(), meta);
      if (newMeta.annotations) {
        newMeta.annotations = newMeta.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
      }
      if (newMeta.captures) {
        newMeta.captures = newMeta.captures.map((capture) => Object.assign(new CaptureSegment(), capture));
      }
      return newMeta;
    });
    return responseMetaData;
  }
  async updateMeta(account: string, container: string, filePath: string, meta: SigMFMetadata): Promise<SigMFMetadata> {
    const response = await axios.put(`/api/datasources/${account}/${container}/${filePath}`, meta);
    let responseMetaData: SigMFMetadata | null = null;
    responseMetaData = Object.assign(new SigMFMetadata(), response.data);
    responseMetaData.annotations = responseMetaData.annotations.map((annotation) =>
      Object.assign(new Annotation(), annotation)
    );
    responseMetaData.captures = responseMetaData.captures.map((capture) =>
      Object.assign(new CaptureSegment(), capture)
    );
    return responseMetaData;
  }
}
