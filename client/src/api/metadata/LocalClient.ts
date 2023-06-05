import { MetadataClient } from './MetadataClient';
import { DataSource } from '../Models';
import { SigMFMetadata, TraceabilityOrigin } from '@/Utils/sigmfMetadata';
import store from '../../Store/store';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';

export class LocalClient implements MetadataClient {
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
    const origin: TraceabilityOrigin = metadata['traceability:origin'];
    if (!origin) {
      metadata['traceability:origin'] = {
        type: 'local',
        account: account,
        container: container,
        filePath: file.webkitRelativePath,
      };
    }
    return metadata;
  }

  async getDataSourceMeta(account: string, container: string): Promise<SigMFMetadata[]> {
    if (!store.getState().localClient?.files) {
      return Promise.reject('No local directory found');
    }
    const localFiles: FileWithDirectoryAndFileHandle[] = store.getState().localClient.files;
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
  updateMeta(account: string, container: string, filePath: string, meta: object): Promise<SigMFMetadata> {
    return Promise.reject('Not implemented');
  }
  list(): Promise<DataSource[]> {
    const localDirectory: FileWithDirectoryAndFileHandle[] = store.getState().localClient.files;
    if (!localDirectory) {
      return Promise.reject('No local directory found');
    }
    let directory = localDirectory[0];
    return Promise.resolve([
      {
        name: directory.name,
        account: 'local',
        container: directory.webkitRelativePath.split('/')[0],
        description: directory.name,
      } as DataSource,
    ]);
  }
  get(account: string, container: string): Promise<DataSource> {
    return Promise.resolve({
      name: container,
      account: account,
      container: container,
      description: container,
    } as DataSource);
  }
  async getMeta(account: string, container: string, filePath: string): Promise<SigMFMetadata> {
    const localDirectory: FileWithDirectoryAndFileHandle[] = store.getState().localClient.files;
    if (!localDirectory) {
      Promise.reject('No local directory found');
    }
    let metadataFile: FileWithDirectoryAndFileHandle | undefined = localDirectory.find((file) => {
      return file.webkitRelativePath === filePath + '.sigmf-meta';
    });
    if (!metadataFile) {
      return Promise.reject('No file found');
    }
    const dataFile = localDirectory.find((file) => {
      return file.webkitRelativePath === filePath + '.sigmf-data';
    });
    if (!dataFile) {
      return Promise.reject('No file found');
    }
    return this.getMetaFromFile(metadataFile, dataFile, account, container);
  }

  features() {
    return {
      update_meta: false,
    };
  }
}
