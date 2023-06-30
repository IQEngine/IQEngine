import { DataSourceClient } from './DataSourceClient';
import { DataSource } from '@/api/Models';
import { SigMFMetadata, TraceabilityOrigin } from '@/Utils/sigmfMetadata';
import store from '@/store/store';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';

export class LocalClient implements DataSourceClient {
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
    const localDirectory: FileWithDirectoryAndFileHandle[] = store.getState().localClient.files;
    if (!localDirectory) {
      return Promise.reject('No local directory found');
    }
    return Promise.resolve({
      name: container,
      account: account,
      container: container,
      description: container,
    } as DataSource);
  }

  create(dataSource: DataSource): Promise<DataSource> {
    return Promise.reject('Not implemented');
  }

  features() {
    return {
      update_meta: false,
    };
  }
}
