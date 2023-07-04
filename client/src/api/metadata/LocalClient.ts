import { MetadataClient } from './MetadataClient';
import { Annotation, CaptureSegment, SigMFMetadata, TraceabilityOrigin } from '@/utils/sigmfMetadata';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';

export class LocalClient implements MetadataClient {
  files: FileWithDirectoryAndFileHandle[];

  constructor(files: FileWithDirectoryAndFileHandle[]) {
    this.files = files;
  }

  async getMetaFromFile(
    file: FileWithDirectoryAndFileHandle,
    dataFile: FileWithDirectoryAndFileHandle,
    account: string,
    container: string
  ) {
    const fileContent = await file.text();
    let metadata = Object.assign(new SigMFMetadata(), JSON.parse(fileContent)) as SigMFMetadata;
    metadata.dataFileHandle = dataFile;
    metadata.metadataFileHandle = file;
    const origin: TraceabilityOrigin = metadata.global['traceability:origin'];
    if (!origin) {
      metadata.global['traceability:origin'] = {
        type: 'local',
        account: account,
        container: container,
        file_path: !file.webkitRelativePath
          ? file.name.replace('.sigmf-meta', '')
          : file.webkitRelativePath.replace('.sigmf-meta', ''),
      };
    }

    if (!metadata.global['traceability:sample_length']) {
      metadata.global['traceability:sample_length'] = Math.round(dataFile.size / 2 / metadata.getBytesPerSample());
    }
    metadata.annotations = metadata.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
    metadata.captures = metadata.captures.map((capture) => Object.assign(new CaptureSegment(), capture));
    console.debug('getMetaFromFile', metadata);
    return metadata;
  }

  async getDataSourceMeta(account: string, container: string): Promise<SigMFMetadata[]> {
    console.debug('getDataSourceMeta', account, container);
    if (!this.files) {
      return Promise.reject('No local directory found');
    }
    const localFiles: FileWithDirectoryAndFileHandle[] = this.files;
    let result: SigMFMetadata[] = [];
    for (let i = 0; i < localFiles.length; i++) {
      const file = localFiles[i];
      if (file.name.split('.').pop() !== 'sigmf-meta') {
        continue;
      }
      // check if there is a corresponding sigmf-data file
      const dataFile = localFiles.find((f) => f.name === file.name.split('.')[0] + '.sigmf-data');
      if (!dataFile) {
        continue;
      }
      let metadata = await this.getMetaFromFile(file, dataFile, account, container);
      result.push(metadata);
    }
    return result;
  }

  updateMeta(account: string, container: string, filePath: string, meta: object): Promise<any> {
    // We do not save the metadata to the file system
    return Promise.resolve(meta as SigMFMetadata);
  }

  async getMeta(account: string, container: string, filePath: string): Promise<SigMFMetadata> {
    const localDirectory: FileWithDirectoryAndFileHandle[] = this.files;
    if (!localDirectory) {
      Promise.reject('No local directory found');
    }
    let metadataFile: FileWithDirectoryAndFileHandle | undefined = localDirectory.find((file) => {
      return file.webkitRelativePath === filePath + '.sigmf-meta' || file.name === filePath + '.sigmf-meta';
    });
    console.debug('metadataFile', metadataFile);
    if (!metadataFile) {
      return Promise.reject('No file found');
    }
    const dataFile = localDirectory.find((file) => {
      return file.webkitRelativePath === filePath + '.sigmf-data' || file.name === filePath + '.sigmf-data';
    });
    if (!dataFile) {
      return Promise.reject('No file found');
    }
    return this.getMetaFromFile(metadataFile, dataFile, account, container);
  }

  features() {
    return {
      canUpdateMeta: false,
    };
  }
}
