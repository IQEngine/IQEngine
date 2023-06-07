import { DataSourceClient } from './DataSourceClient';
import { DataSource } from '../Models';
import { SigMFMetadata, TraceabilityOrigin } from '@/Utils/sigmfMetadata';
import store from '../../Store/store';
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
    return Promise.resolve({
      name: container,
      account: account,
      container: container,
      description: container,
    } as DataSource);
  }

  features() {
    return {
      update_meta: false,
    };
  }
}
