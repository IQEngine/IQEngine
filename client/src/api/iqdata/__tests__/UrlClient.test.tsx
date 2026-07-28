import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { test, describe, afterEach, vi } from 'vitest';
import { UrlClient } from '@/api/iqdata/UrlClient';
import { UrlClient as UrlMetadataClient } from '@/api/metadata/url-client';
import { IQDataSlice } from '@/api/Models';
import { CLIENT_TYPE_URL, encodeUrlParam } from '@/utils/url-datasource';

describe('url data source client tests', () => {
  const META_URL = 'https://example.org/recordings/my_recording.sigmf-meta';
  const DATA_URL = 'https://cdn.example.org/my_recording.sigmf-data';
  const account = encodeUrlParam(META_URL);
  const container = encodeUrlParam(DATA_URL);

  const baseMetadataFile = {
    global: {
      'core:datatype': 'cf32_le', // 8 bytes per IQ sample
      'core:sample_rate': 480000,
      'core:version': '1.0.0',
      'core:author': 'Marc',
    },
    captures: [{ 'core:sample_start': 0, 'core:frequency': 8486285000 }],
    annotations: [],
  };

  function metadataWithOrigin(): SigMFMetadata {
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(baseMetadataFile)));
    meta.global['traceability:sample_length'] = 1024;
    meta.global['traceability:origin'] = {
      type: CLIENT_TYPE_URL,
      account: account,
      container: container,
      file_path: 'my_recording',
    };
    return meta;
  }

  // Records every request so the tests can assert on the ranges asked for.
  function mockFetch(handler: (url: string, init: RequestInit) => Response) {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal('fetch', (url: string, init: RequestInit = {}) => {
      calls.push({ url, init });
      return Promise.resolve(handler(url, init));
    });
    return calls;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('metadata is read from the meta URL and points back at both URLs', async ({ expect }) => {
    const calls = mockFetch((url, init) => {
      if (url === META_URL) return new Response(JSON.stringify(baseMetadataFile), { status: 200 });
      if (url === DATA_URL && init.method === 'HEAD')
        return new Response(null, { status: 200, headers: { 'content-length': '8192' } });
      throw new Error('unexpected request: ' + url);
    });

    const meta = await new UrlMetadataClient().getMeta(account, container, 'my_recording');
    expect(meta.getOrigin().type).toEqual(CLIENT_TYPE_URL);
    expect(meta.getMetadataUrl()).toEqual(META_URL);
    expect(meta.getDataUrl()).toEqual(DATA_URL);
    // No sample count in the file, so it comes from the data file's length.
    expect(meta.getTotalSamples()).toEqual(1024);
    expect(calls.map((call) => call.url)).toEqual([META_URL, DATA_URL]);
  });

  test('a data file that rejects HEAD still yields a sample count', async ({ expect }) => {
    mockFetch((url, init) => {
      if (url === META_URL) return new Response(JSON.stringify(baseMetadataFile), { status: 200 });
      if (init.method === 'HEAD') return new Response(null, { status: 405 });
      return new Response(new ArrayBuffer(1), {
        status: 206,
        headers: { 'content-range': 'bytes 0-0/8192' },
      });
    });

    const meta = await new UrlMetadataClient().getMeta(account, container, 'my_recording');
    expect(meta.getTotalSamples()).toEqual(1024);
  });

  test('a missing metadata file is rejected', async ({ expect }) => {
    mockFetch(() => new Response(null, { status: 404, statusText: 'Not Found' }));
    await expect(new UrlMetadataClient().getMeta(account, container, 'my_recording')).rejects.toThrow(/404/);
  });

  test('IQ blocks are fetched as byte ranges of the data file', async ({ expect }) => {
    const calls = mockFetch((url, init) => {
      const [start, end] = /bytes=(\d+)-(\d+)/.exec(init.headers['Range']).slice(1).map(Number);
      return new Response(new ArrayBuffer(end - start + 1), { status: 206 });
    });

    const abortSignal: AbortSignal = AbortSignal.timeout(100000);
    const blocks: IQDataSlice[] = await new UrlClient().getIQDataBlocks(metadataWithOrigin(), [2, 3], 128, abortSignal);
    expect(blocks.length).toEqual(2);
    expect(blocks.map((block) => block.index)).toEqual([2, 3]);
    // 128 samples of cf32_le is 1024 bytes, so block 2 starts at 2048, and the
    // two contiguous blocks are asked for in one request.
    expect(calls.length).toEqual(1);
    expect(calls[0].url).toEqual(DATA_URL);
    expect(calls[0].init.headers['Range']).toEqual('bytes=2048-4095');
    // 128 complex samples -> 256 floats
    expect(blocks[0].iqArray.length).toEqual(256);
  });

  test('a host that ignores Range is sliced client-side', async ({ expect }) => {
    mockFetch(() => new Response(new ArrayBuffer(8192), { status: 200 }));

    const abortSignal: AbortSignal = AbortSignal.timeout(100000);
    const blocks: IQDataSlice[] = await new UrlClient().getIQDataBlocks(metadataWithOrigin(), [1], 128, abortSignal);
    expect(blocks.length).toEqual(1);
    expect(blocks[0].iqArray.length).toEqual(256);
  });
});
