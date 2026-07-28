import { Annotation, CaptureSegment, SigMFMetadata, Track } from '@/utils/sigmfMetadata';
import { MetadataClient } from './metadata-client';
import { SmartQueryResult } from '../Models';
import { CLIENT_TYPE_URL, fetchDataFileByteLength, urlRecordingLocation } from '@/utils/url-datasource';

export class UrlClient implements MetadataClient {
  track(account: string, container: string, filepath: string): Promise<Track> {
    throw new Error('track not supported for url data sources');
  }

  async getMeta(account: string, container: string, filePath: string): Promise<SigMFMetadata> {
    const { metaUrl, dataUrl } = urlRecordingLocation(account, container);
    const response = await fetch(metaUrl);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText} fetching ${metaUrl}`);
    }
    const metadata = Object.assign(new SigMFMetadata(), await response.json()) as SigMFMetadata;

    // The origin in the file (if any) describes wherever the recording was
    // published from, which is not how this page reached it -- the URLs in the
    // route are the only way back to the data, so they always win.
    metadata.global['traceability:origin'] = {
      type: CLIENT_TYPE_URL,
      account: account,
      container: container,
      file_path: filePath,
    };
    if (!metadata.global['traceability:sample_length']) {
      const byteLength = await fetchDataFileByteLength(dataUrl);
      metadata.global['traceability:sample_length'] = Math.floor(byteLength / metadata.getBytesPerIQSample());
    }
    metadata.annotations = (metadata.annotations ?? []).map((annotation) =>
      Object.assign(new Annotation(), annotation)
    );
    metadata.captures = (metadata.captures ?? []).map((capture) => Object.assign(new CaptureSegment(), capture));
    return metadata;
  }

  // A URL recording is a single file, not a browsable data source.
  async getDataSourceMetaPaths(account: string, container: string): Promise<string[]> {
    return [];
  }

  updateMeta(account: string, container: string, filePath: string, meta: object): Promise<any> {
    // Nothing to write to: the recording is someone else's static file.
    return Promise.resolve(meta as SigMFMetadata);
  }

  async smartQuery(queryString: string, signal: AbortSignal): Promise<SmartQueryResult> {
    throw new Error('smartQuery not supported for url data sources');
  }

  features() {
    return {
      canUpdateMeta: false,
    };
  }
}
