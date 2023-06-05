import { SigMFMetadata, TraceabilityOrigin } from '@/Utils/sigmfMetadata';
import store from '../../Store/store';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { IQDataClient } from './IQDataClient';
import { IQDataSlice } from '../Models';

export class LocalClient implements IQDataClient {
  getIQDataSlices(meta: SigMFMetadata, indexes: number[], tileSize: number): Promise<Record<number, IQDataSlice>> {
    throw new Error('Method not implemented.');
  }
  getIQDataSlice(meta: SigMFMetadata, index: number): Promise<IQDataSlice> {
    throw new Error('Method not implemented.');
  }
}
