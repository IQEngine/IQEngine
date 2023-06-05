import { Annotation, CaptureSegment, SigMFMetadata } from '@/Utils/sigmfMetadata';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { MetadataClient } from './MetadataClient';
import { getContainerClient } from '../utils/AzureBlob';

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      resolve(text);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the Blob as text.'));
    };

    reader.readAsText(blob);
  });
}

async function blobNameToMetadata(blobName: string, containerClient: ContainerClient): Promise<SigMFMetadata> {
  const fName = blobName.split('.')[0];
  const blobClient = containerClient.getBlobClient(fName + '.sigmf-meta');
  let blobBody = await (await blobClient.download()).blobBody;
  let recording: SigMFMetadata | null = null;
  try {
    let jsonString = await readBlobAsText(blobBody);
    let objectFromJson = JSON.parse(jsonString);
    recording = Object.assign(new SigMFMetadata(), objectFromJson);
  } catch (e) {
    console.error(e);
  }
  if (!recording) {
    return null;
  }
  const blobDataClient = containerClient.getBlobClient(fName + '.sigmf-data');
  recording.dataClient = blobDataClient;
  let properties = await blobDataClient.getProperties();
  if (!recording) {
    return null;
  }
  if (!recording.global['traceability:sample_length']) {
    recording.global['traceability:sample_length'] = Math.round(
      properties.contentLength / 2 / recording.getBytesPerSample()
    );
  }
  if (!recording.global['traceability:origin']) {
    recording.global['traceability:origin'] = {
      type: 'azure_blob',
      account: containerClient.accountName,
      container: containerClient.containerName,
      file_path: fName,
    };
  }
  recording.annotations = recording.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
  recording.captures = recording.captures.map((capture) => Object.assign(new CaptureSegment(), capture));
  return recording;
}

export class BlobClient implements MetadataClient {
  async getMeta(account: string, container: string, filePath: string): Promise<SigMFMetadata> {
    const containerClient = getContainerClient(account, container);
    return blobNameToMetadata(filePath, containerClient);
  }

  async getDataSourceMeta(account: string, container: string): Promise<SigMFMetadata[]> {
    const containerClient = getContainerClient(account, container);
    const blobNames: Array<string> = [];
    for await (const i of containerClient.listBlobsFlat()) blobNames.push(i.name);
    const blobsToProcess = blobNames.filter(
      (blobName) =>
        blobName.split('.').pop() === 'sigmf-meta' && blobNames.includes(blobName.split('.')[0] + '.sigmf-data')
    );

    let blobOperations = blobsToProcess.map(async (blobName) => {
      return await blobNameToMetadata(blobName, containerClient);
    });
    let recordings = await Promise.all(blobOperations);
    recordings = recordings.filter((recording) => recording !== null) as SigMFMetadata[];
    return recordings.filter((recording) => recording !== null) as SigMFMetadata[];
  }

  async updateMeta(account: string, container: string, filePath: string, meta: SigMFMetadata): Promise<SigMFMetadata> {
    // Currently update meta doesnt even try to update the blob so we are just going to return here
    return meta;

    const containerClient = getContainerClient(account, container);
    const blockBlobClient = containerClient.getBlockBlobClient(filePath);
    const metaString = JSON.stringify(meta);
    const metaBlob = new Blob([metaString]);
    await blockBlobClient.upload(metaBlob, metaString.length);
    return meta;
  }

  features() {
    return {
      update_meta: false,
    };
  }
}
