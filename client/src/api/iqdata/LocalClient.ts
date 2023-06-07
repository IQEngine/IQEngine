import { SigMFMetadata, TraceabilityOrigin } from '@/Utils/sigmfMetadata';
import store from '../../Store/store';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { IQDataClient } from './IQDataClient';
import { IQDataSlice } from '../Models';

export class LocalClient implements IQDataClient {
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

  getIQDataSlices(meta: SigMFMetadata, indexes: number[], tileSize: number): Promise<IQDataSlice[]> {
    return Promise.resolve([]);
  }
  getIQDataSlice(meta: SigMFMetadata, index: number): Promise<IQDataSlice> {
    return Promise.resolve({} as IQDataSlice);
  }
}
