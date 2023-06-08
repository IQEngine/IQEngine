import { test } from 'vitest';
import nock from 'nock';
import { ApiClient } from '../ApiClient';
import { SigMFMetadata, Annotation, CaptureSegment } from '@/Utils/sigmfMetadata';

const account = 'gnuradio';
const container = 'iqengine';
const filePath = 'bluetooth';

test('getMeta should return metadata', async ({ expect }) => {
  let expectedMeta = {
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
      'traceability:revision': 1,
      'traceability:origin': {
        type: 'API',
        account: 'gnuradio',
        container: 'iqengine',
        file_path: 'bluetooth',
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
  };

  //let testMetadata: SigMFMetadata | null = null;
  //testMetadata = Object.assign(new SigMFMetadata(), expectedMeta);
  //testMetadata.annotations = testMetadata.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
  //testMetadata.captures = testMetadata.captures.map((capture) => Object.assign(new CaptureSegment(), capture));

  nock('http://localhost:3000').get(`/api/datasources/${account}/${container}/${filePath}`).reply(200, expectedMeta);

  const client = new ApiClient();
  const result = await client.getMeta(account, container, filePath);
  expect(result).toEqual(expectedMeta);
});

test('getDataSourceMeta should return an array of metadata', async ({ expect }) => {
  let expectedMeta = [
    {
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
        'traceability:revision': 1,
        'traceability:origin': {
          type: 'API',
          account: 'gnuradio',
          container: 'iqengine',
          file_path: 'bluetooth',
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
    },
    {
      global: {
        'core:datatype': 'cf32_le',
        'core:sample_rate': 480000,
        'core:version': '0.0.2',
        'core:sha512':
          'bb2f1f9222b172373e81d333a11a866d56611308fd481c7f9c2462e50fec62da1bddd93a94cd9b3e00dcaa6ba4ffe4546022aa50385bc582fc8dd7426740b564',
        'core:description': '',
        'core:author': 'Paulfo',
        'core:recorder': 'GNU Radio 3.8.2',
        'core:license': 'https://creativecommons.org/licenses/by/4.0/',
        'traceability:revision': 1,
        'traceability:origin': {
          type: 'API',
          account: 'gnuradio',
          container: 'iqengine',
          file_path: 'bluetoothpaulfo',
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
    },
  ];

  //   let testMetadata: SigMFMetadata[] = expectedMeta.map((meta) => {
  //     let newMeta = Object.assign(new SigMFMetadata(), meta);
  //     if (newMeta.annotations) {
  //       newMeta.annotations = newMeta.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
  //     }
  //     if (newMeta.captures) {
  //       newMeta.captures = newMeta.captures.map((capture) => Object.assign(new CaptureSegment(), capture));
  //     }
  //     return newMeta;
  //   });

  nock('http://localhost:3000').get(`/api/datasources/${account}/${container}/meta`).reply(200, expectedMeta);

  const client = new ApiClient();
  const result = await client.getDataSourceMeta(account, container);
  expect(result).toEqual(expectedMeta);
});

test('updateMeta should return updated metadata', async ({ expect }) => {
  let expectedMeta = {
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
      'traceability:revision': 1,
      'traceability:origin': {
        type: 'API',
        account: 'gnuradio',
        container: 'iqengine',
        file_path: 'bluetooth',
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
  };

  let newMeta = {
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
      'traceability:revision': 1,
      'traceability:origin': {
        type: 'API',
        account: 'gnuradio',
        container: 'iqengine',
        file_path: 'bluetooth',
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
        'core:sample_start': 260880,
        'core:sample_count': 285354,
        'core:freq_lower_edge': 8486138750,
        'core:freq_upper_edge': 8486243700,
        'core:description': 'first',
      },
    ],
  };

  let newMetaData: SigMFMetadata | null = null;
  newMetaData = Object.assign(new SigMFMetadata(), newMeta);
  newMetaData.annotations = newMetaData.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
  newMetaData.captures = newMetaData.captures.map((capture) => Object.assign(new CaptureSegment(), capture));

  nock('http://localhost:3000')
    .put(`/api/datasources/${account}/${container}/${filePath}`, newMeta)
    .reply(200, expectedMeta);

  const client = new ApiClient();
  const result = await client.updateMeta(account, container, filePath, newMetaData);
  expect(result).toEqual(expectedMeta);
});
