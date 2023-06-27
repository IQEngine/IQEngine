import { test, describe } from 'vitest';
import nock from 'nock';
import { ApiClient } from '@/api/datasource/ApiClient';
import { DataSource } from '@/api/Models';

describe('ApiClient Metadata Tests', () => {
  test('list should return a list of data sources', async ({ expect }) => {
    const data: DataSource[] = [
      {
        type: 'API',
        name: 'gnuradio',
        account: 'gnuradio',
        container: 'iqengine',
        description: 'GNU Radio hosted test data',
      },
      {
        type: 'API',
        name: 'another',
        account: 'another',
        container: 'iqengine',
        description: 'Another GNU Radio hosted test data',
      },
    ];
    nock('http://localhost:3000').get('/api/datasources').reply(200, data);

    const client = new ApiClient();
    const result = await client.list();
    expect(result).toEqual(data);
  });

  test('get should return a data source', async ({ expect }) => {
    const data: DataSource = {
      type: 'API',
      name: 'gnuradio',
      account: 'gnuradio',
      container: 'iqengine',
      description: 'GNU Radio hosted test data',
    };
    nock('http://localhost:3000').get('/api/datasources/gnuradio/iqengine/datasource').reply(200, data);

    const client = new ApiClient();
    const result = await client.get('gnuradio', 'iqengine');
    expect(result).toEqual(data);
  });
});
