import { SigMFMetadata, TraceabilityOrigin } from '@/Utils/sigmfMetadata';
import store from '../../Store/store';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { IQDataClient } from './IQDataClient';
import { IQDataSlice } from '../Models';
import { convertToFloat32 } from '@/Sources/FetchMoreDataSource';

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
    return Promise.all(indexes.map((index) => this.getIQDataSlice(meta, index, tileSize)));
  }

  async getIQDataSlice(meta: SigMFMetadata, index: number, tileSize: number): Promise<IQDataSlice> {
    const localDirectory: FileWithDirectoryAndFileHandle[] = store.getState().localClient.files;
    if (!localDirectory) {
      Promise.reject('No local directory found');
    }
    const filePath = meta.getOrigin().file_path;
    const dataFile = localDirectory.find((file) => {
      return file.webkitRelativePath === filePath + '.sigmf-data';
    });
    if (!dataFile) {
      return Promise.reject('No data file found');
    }
    const bytesPerSample = meta.getBytesPerSample();
    const offsetBytes = index * tileSize * bytesPerSample * 2;
    const countBytes = tileSize * bytesPerSample * 2;
    const slice = dataFile.slice(offsetBytes, offsetBytes + countBytes);
    const buffer = await slice.arrayBuffer();
    const iqArray = convertToFloat32(buffer, meta.getDataType());
    return { index, iqArray };
  }
}
