import axios from 'axios';
import { IQDataClient } from './IQDataClient';
import { SigMFMetadata } from '@/Utils/sigmfMetadata';
import { IQDataSlice } from '../Models';

export class ApiClient implements IQDataClient {
  getIQDataSlices(meta: SigMFMetadata, indexes: number[], tileSize: number): Promise<IQDataSlice[]> {
    throw new Error('Method not implemented.');
  }
  getIQDataSlice(meta: SigMFMetadata, index: number): Promise<IQDataSlice> {
    throw new Error('Method not implemented.');
  }
}
