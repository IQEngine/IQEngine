import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { test, describe } from 'vitest';
import { LocalClient } from '@/api/iqdata/LocalClient';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { IQDataSlice } from '@/api/Models';

describe('local file client tests', () => {

  const baseMetadataFile = {
    global: {
      'core:datatype': 'cf32_le',
      'core:sample_rate': 480000,
      'core:version': '0.0.2',
      'core:sha512':
        'bb2f1f9222b172373e81d333a11a866d56611308fd481c7f9c2462e50fec62da1bddd93a94cd9b3e00dcaa6ba4ffe4546022aa50385bc582fc8dd7426740b564',
      'core:description': '',
      'core:author': 'Marc',
      'core:recorder': 'GNU Radio 3.8.2',
      'core:license': 'https://creativecommons.org/licenses/by/4.0/',
      'traceability:sample_length': 128,
      'traceability:origin': {
        type: 'local',
        account: '',
        container: '',
        file_path: 'my_recording',
      },
    },
    captures: [
      {
        'core:sample_start': 0,
        'core:frequency': 8486285000,
        'core:datetime': '2020-12-20T17:32:07.142626',
      },
    ],
    annotations: [
      {
        'core:sample_start': 260780,
        'core:sample_count': 285354,
        'core:freq_lower_edge': 8486138750,
        'core:freq_upper_edge': 8486243700,
        'core:label': 'first',
      },
    ],
    dataFileHandle: {
      name: 'my_recording.sigmf-data',
      text: () => Promise.resolve(''),
      webkitRelativePath: '',
      size: 1024,
    },
    metadataFileHandle: {
      name: 'my_recording.sigmf-meta',
      text: () => Promise.resolve(''),
      webkitRelativePath: '',
      size: 1024,
    },
  };

  function mockDataFile(fileName: string, contents: any): FileWithDirectoryAndFileHandle {
    return {
      name: fileName,
      webkitRelativePath: '',
      text: () => { return contents; },
      size: 1024,
      slice: (start, end) => {
        return {
          arrayBuffer: (): Promise<ArrayBuffer> => {
            return Promise.resolve(new ArrayBuffer(end - start));
          }
        } as Blob;
      }
    } as FileWithDirectoryAndFileHandle;
  };

  test('Request for non-existing folder is rejected', async ({expect}) => {
    let localFiles: FileWithDirectoryAndFileHandle[];
    const metaData: SigMFMetadata = new SigMFMetadata();;
    const abortSignal: AbortSignal = AbortSignal.timeout(100);

    const client = new LocalClient(localFiles);
    await expect(client.getIQDataBlocks(metaData, [1, 2, 3, 4], 128, abortSignal)).rejects.toThrow();
  });

  test('Request for non-existing file is rejected', async ({expect}) => {
    const abortSignal: AbortSignal = AbortSignal.timeout(100000);
    const testMetadata = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(baseMetadataFile)));
    const localFiles: FileWithDirectoryAndFileHandle[] = [
        mockDataFile("nonexistentfile.sigmf-meta", JSON.stringify(testMetadata)),
        mockDataFile("nonexistentfile.sigmf-data", "")
    ];

    const client = new LocalClient(localFiles);
    await expect(client.getIQDataBlocks(testMetadata, [1, 2, 3, 4], 128, abortSignal)).rejects.toThrow('No data file found');
  });


  test('Request for empty list succeeds', async ({expect}) => {
    const abortSignal: AbortSignal = AbortSignal.timeout(100000);
    const testMetadata = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(baseMetadataFile)));
    const localFiles: FileWithDirectoryAndFileHandle[] = [
        mockDataFile(testMetadata.metadataFileHandle.name, JSON.stringify(testMetadata)),
        mockDataFile(testMetadata.dataFileHandle.name, '')
    ];

    const client = new LocalClient(localFiles);
    const blocks: IQDataSlice[] = await client.getIQDataBlocks(testMetadata, [], 128, abortSignal);
    expect(blocks.length).toEqual(0);
  });

  test('Request requesting 0th slice succeeds', async ({expect}) => {
    const abortSignal: AbortSignal = AbortSignal.timeout(100000);
    const testMetadata = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(baseMetadataFile)));
    const localFiles: FileWithDirectoryAndFileHandle[] = [
        mockDataFile(testMetadata.metadataFileHandle.name, JSON.stringify(testMetadata)),
        mockDataFile(testMetadata.dataFileHandle.name, '')
    ];

    const client = new LocalClient(localFiles);
    const blocks: IQDataSlice[] = await client.getIQDataBlocks(testMetadata, [0], 128, abortSignal);
    expect(blocks.length).toEqual(1);
    expect(blocks[0].index).toEqual(0);
    expect(blocks[0].iqArray.length).toEqual(128 * testMetadata.getBytesPerIQSample() / Float32Array.BYTES_PER_ELEMENT);
  });
});
