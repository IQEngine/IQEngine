import { test, describe } from 'vitest';
import { LocalClient } from '@/api/metadata/LocalClient';
import { FileWithDirectoryAndFileHandle } from 'browser-fs-access';
const account = 'local';
const container = 'local';
const filePath = 'my_recording';
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
      account: account,
      container: container,
      file_path: filePath,
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
      'core:description': 'first',
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

describe('Local Client Metadata Tests', () => {
  test('filePath should get from nname when there is no webkitrelativepath', async ({ expect }) => {
    let testMetadata = JSON.parse(JSON.stringify(baseMetadataFile));
    testMetadata.global['traceability:origin'] = undefined;
    let metadataFile = {
      name: 'my_recording.sigmf-meta',
      webkitRelativePath: '',
      text: () => Promise.resolve(JSON.stringify(testMetadata)),
      size: 1024,
    } as FileWithDirectoryAndFileHandle;
    let dataFile = {
      name: 'my_recording.sigmf-data',
      text: () => Promise.resolve(''),
      webkitRelativePath: '',
      size: 1024,
    } as FileWithDirectoryAndFileHandle;

    const client = new LocalClient([metadataFile, dataFile]);
    const result = await client.getMeta(account, container, filePath);
    expect(result.annotations).toEqual(baseMetadataFile.annotations);
    expect(result.captures).toEqual(baseMetadataFile.captures);
    expect(result.global).toEqual(baseMetadataFile.global);
  });

  test('filePath should get from webkitrelativepath first', async ({ expect }) => {
    let testMetadata = JSON.parse(JSON.stringify(baseMetadataFile));
    testMetadata.global['traceability:origin'] = undefined;
    let metadataFile = {
      name: 'another wrong file name',
      webkitRelativePath: 'my_recording.sigmf-meta',
      text: () => Promise.resolve(JSON.stringify(testMetadata)),
      size: 1024,
    } as FileWithDirectoryAndFileHandle;
    let dataFile = {
      name: 'wrong file name',
      text: () => Promise.resolve(''),
      webkitRelativePath: 'my_recording.sigmf-data',
      size: 1024,
    } as FileWithDirectoryAndFileHandle;

    const client = new LocalClient([metadataFile, dataFile]);
    const result = await client.getMeta(account, container, filePath);
    expect(result.annotations).toEqual(baseMetadataFile.annotations);
    expect(result.captures).toEqual(baseMetadataFile.captures);
    expect(result.global).toEqual(baseMetadataFile.global);
  });
});
