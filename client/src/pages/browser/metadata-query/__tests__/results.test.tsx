import '@/mocks/setup-tests';
import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import Results from '@/pages/browser/metadata-query/results';
import { SigMFMetadata, Annotation, CaptureSegment } from '@/utils/sigmfMetadata';
import { useAllProviders } from '@/mocks/setup-tests';

describe('disabled test', () => {
  test('null test', () => {});
});

/* TODO: This test needs to be fixed, we starting getting the following error after adding konva to the FileRow component:
            Error: Cannot find module 'canvas'
            Require stack:
            - /home/runner/work/IQEngine/IQEngine/client/node_modules/konva/lib/index-node.js
            - /home/runner/work/IQEngine/IQEngine/client/node_modules/react-konva/lib/ReactKonva.js
            ❯ Object.<anonymous> node_modules/konva/lib/index-node.js:4:16

const createMetadata = () => {
  const raw = [
    {
      global: {
        'antenna:gain': null,
        'antenna:type': null,
        'core:datatype': 'cf32_le',
        'core:sample_rate': 480000,
        'core:version': '0.0.2',
        'core:num_channels': null,
        'core:sha512':
          'bb2f1f9222b172373e81d333a11a866d56611308fd481c7f9c2462e50fec62da1bddd93a94cd9b3e00dcaa6ba4ffe4546022aa50385bc582fc8dd7426740b564',
        'core:offset': null,
        'core:description': '',
        'core:author': 'Marc',
        'core:meta_doi': null,
        'core:data_doi': null,
        'core:recorder': 'GNU Radio 3.8.2',
        'core:license': 'https://creativecommons.org/licenses/by/4.0/',
        'core:hw': null,
        'core:dataset': null,
        'core:trailing_bytes': null,
        'core:metadata_only': null,
        'core:geolocation': null,
        'core:extensions': null,
        'core:collection': null,
        'traceability:revision': 1,
        'traceability:origin': {
          type: 'api',
          account: 'rdfxmapsds',
          container: 'sigmf',
          file_path: 'TEST_FILE_PATH',
        },
        'traceability:sample_length': 480000,
      },
      captures: [
        {
          'core:sample_start': 0,
          'core:global_index': null,
          'core:header_bytes': null,
          'core:frequency': 8486285000,
          'core:datetime': '2020-12-20T17:32:07.142626',
        },
      ],
      annotations: [
        {
          'core:sample_start': 260778,
          'core:sample_count': 285354,
          'core:generator': null,
          'core:label': null,
          'core:comment': null,
          'core:freq_lower_edge': 8486138750,
          'core:freq_upper_edge': 8486243700,
          'core:uuid': null,
          'core:description': 'first-1',
        },
      ],
    },
  ];
  return {
    parsed: raw.map((item, i) => {
      item = Object.assign(new SigMFMetadata(), item);
      item.annotations = item.annotations?.map((annotation) => Object.assign(new Annotation(), annotation));
      item.captures = item.captures?.map((capture) => Object.assign(new CaptureSegment(), capture));
      return item;
    }),
    raw,
  };
};

vi.mock('@/api/metadata/queries', async () => {
  return {
    queryMeta: vi.fn(() => ({
      data: createMetadata().parsed,
      isLoading: false,
    })),
    fetchMeta: vi.fn(() => ({
      data: createMetadata().parsed,
      isLoading: false,
    })),
    fetchDataSourceMeta: () => {},
    updateDataSourceMeta: () => {},
    getDataSourceMeta: () => {},
    useQueryDataSourceMetaPaths: () => {},
    getMeta: () => ({
      data: createMetadata().parsed[0],
    }),
    useUpdateMeta: () => {},
    useGetMetadataFeatures: () => {},
  };
});

describe('Test Results', () => {
  test('Basic Rendering', () => {
    render(<Results queryString="" />);
  });
  test('Basic Rendering', async () => {
    var { wrapper } = useAllProviders();
    render(<Results queryString="test query string" />, { wrapper });
    waitFor(() => expect(screen.findByText("Sample Count")).toBeInTheDocument());
  });
});
*/
