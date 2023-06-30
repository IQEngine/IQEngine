import { Annotation, SigMFMetadata } from '@/utils/sigmfMetadata';

const sampleSigmfMetadata: SigMFMetadata = Object.assign(new SigMFMetadata(), {
  global: {
    'core:author': 'TestAuthor',
    'core:datatype': 'cf32_le',
    'core:sample_rate': 1e6,
    'core:version': '0.0.1',
    'core:num_channels': 2,
    'traceability:origin': {},
  },
});

describe('getEmail', () => {
  test.each`
    author                | expected
    ${'TestUser'}         | ${null}
    ${'TestUser <email>'} | ${'email'}
  `('should return email', ({ author, expected }) => {
    sampleSigmfMetadata.global['core:author'] = author;
    expect(sampleSigmfMetadata.getEmail()).toBe(expected);
  });
});

describe('getAuthor', () => {
  test.each`
    author                | expected
    ${'TestUser'}         | ${'TestUser'}
    ${'TestUser <email>'} | ${'TestUser <email>'}
  `('should return author', ({ author, expected }) => {
    sampleSigmfMetadata.global['core:author'] = author;
    expect(sampleSigmfMetadata.getAuthor()).toBe(expected);
  });
});

describe('getFullFilePath', () => {
  test.each`
    origin                                                                                        | expected
    ${{ type: 'local', account: 'account', container: 'container', file_path: 'file_path' }}      | ${'file_path'}
    ${{ type: 'azure_blob', account: 'account', container: 'container', file_path: 'file_path' }} | ${'https://account.blob.core.windows.net/container/file_path'}
  `('should return full file path', ({ origin, expected }) => {
    sampleSigmfMetadata.global['traceability:origin'] = origin;
    expect(sampleSigmfMetadata.getFullFilePath()).toBe(expected);
  });
});

describe('getDataTypeDescription', () => {
  test.each`
    datatype     | expected
    ${'cf32'}    | ${'complex\nfloat\n32 bits'}
    ${'cf32_le'} | ${'complex\nfloat\n32 bits'}
    ${'cf32_be'} | ${'complex\nfloat\n32 bits_be'}
    ${'cf64'}    | ${'complex\nfloat\n64 bits'}
    ${'cf64_le'} | ${'complex\nfloat\n64 bits'}
    ${'cf64_be'} | ${'complex\nfloat\n64 bits_be'}
    ${'ci8'}     | ${'complex\nsigned int\n8 bits'}
    ${'ci8_le'}  | ${'complex\nsigned int\n8 bits'}
    ${'ci8_be'}  | ${'complex\nsigned int\n8 bits_be'}
    ${'ci16'}    | ${'complex\nsigned int\n16 bits'}
    ${'ci16_le'} | ${'complex\nsigned int\n16 bits'}
    ${'ci16_be'} | ${'complex\nsigned int\n16 bits_be'}
    ${'ci32'}    | ${'complex\nsigned int\n32 bits'}
    ${'ci32_le'} | ${'complex\nsigned int\n32 bits'}
    ${'ci32_be'} | ${'complex\nsigned int\n32 bits_be'}
    ${'ci64'}    | ${'complex\nsigned int\n64 bits'}
    ${'ci64_le'} | ${'complex\nsigned int\n64 bits'}
    ${'ci64_be'} | ${'complex\nsigned int\n64 bits_be'}
  `('should return data type', ({ datatype, expected }) => {
    sampleSigmfMetadata.global['core:datatype'] = datatype;
    expect(sampleSigmfMetadata.getDataTypeDescription()).toBe(expected);
  });
});

describe('getSampleRate', () => {
  test.each`
    sampleRate
    ${1e6}
    ${1e9}
  `('should return sample rate', ({ sampleRate }) => {
    sampleSigmfMetadata.global['core:sample_rate'] = sampleRate;
    expect(sampleSigmfMetadata.getSampleRate()).toBe(sampleRate);
  });
});

describe('getBytesPerSample', () => {
  test.each`
    datatype     | expected
    ${'cf32'}    | ${4}
    ${'cf32_le'} | ${4}
    ${'cf32_be'} | ${4}
    ${'cf64'}    | ${8}
    ${'cf64_le'} | ${8}
    ${'cf64_be'} | ${8}
    ${'ci8'}     | ${1}
    ${'ci8_le'}  | ${1}
    ${'ci8_be'}  | ${1}
    ${'ci16'}    | ${2}
    ${'ci16_le'} | ${2}
  `('should have the number of bytes', ({ datatype, expected }) => {
    sampleSigmfMetadata.global['core:datatype'] = datatype;
    expect(sampleSigmfMetadata.getBytesPerSample()).toBe(expected);
  });
});

describe('getCanonicalFilePath', () => {
  test.each`
    origin                                                                                        | expected
    ${{ type: 'local', account: 'account', container: 'container', file_path: 'file_path' }}      | ${'account/container/file_path'}
    ${{ type: 'azure_blob', account: 'account', container: 'container', file_path: 'file_path' }} | ${'account/container/file_path'}
  `('should return canonical file path', ({ origin, expected }) => {
    sampleSigmfMetadata.global['traceability:origin'] = origin;
    expect(sampleSigmfMetadata.getCanonicalFilePath()).toBe(expected);
  });
});

describe('getShortDescription', () => {
  test.each`
    description                                        | expected
    ${Array.from({ length: 100 }, () => 'a').join('')} | ${Array.from({ length: 60 }, () => 'a').join('') + '...'}
    ${Array.from({ length: 50 }, () => 'a').join('')}  | ${Array.from({ length: 50 }, () => 'a').join('')}
  `('should return short description', ({ description, expected }) => {
    sampleSigmfMetadata.global['core:description'] = description;
    expect(sampleSigmfMetadata.getShortDescription()).toBe(expected);
  });
});

describe('getSigMFRaw', () => {
  test('should return sigmf raw', () => {
    const expectedRaw = JSON.stringify(
      {
        global: sampleSigmfMetadata.global,
        captures: [],
        annotations: [],
      },
      null,
      4
    );
    expect(sampleSigmfMetadata.getSigMFRaw()).toBe(expectedRaw);
  });

  test('should return sigmf raw with all values populated', () => {
    sampleSigmfMetadata.annotations = [
      Object.assign(new Annotation(), {
        'core:sample_start': 0,
        'core:sample_count': 100,
        'core:description': 'test',
      }),
    ];

    sampleSigmfMetadata.captures = [
      Object.assign(new Annotation(), {
        'core:sample_start': 0,
      }),
    ];

    const expectedRaw = JSON.stringify(
      {
        global: sampleSigmfMetadata.global,
        captures: sampleSigmfMetadata.captures,
        annotations: sampleSigmfMetadata.annotations,
      },
      null,
      4
    );
    expect(sampleSigmfMetadata.getSigMFRaw()).toBe(expectedRaw);
  });
});
