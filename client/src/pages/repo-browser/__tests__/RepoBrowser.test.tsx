import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import RepoBrowser from '@/pages/repo-browser/RepoBrowser';
import { RepositoryTile } from '@/pages/repo-browser/RepositoryTile';
import React from 'react';
import nock from 'nock';
import '@testing-library/jest-dom';
import { DataSource } from '@/api/Models';
import { AllProviders, queryClient } from '@/mocks/setupTests';

describe('Test RepoBrowser', () => {
  beforeAll(() => {
    import.meta.env.IQENGINE_CONNECTION_INFO = '{}';
    import.meta.env.IQENGINE_GOOGLE_ANALYTICS_KEY = 'UA-TEST-KEY-1';
    import.meta.env.IQENGINE_FEATURE_FLAGS = { useAPIDatasources: true };
  });
  afterAll(() => {
    delete import.meta.env.IQENGINE_CONNECTION_INFO;
    delete import.meta.env.IQENGINE_GOOGLE_ANALYTICS_KEY;
    delete import.meta.env.IQENGINE_FEATURE_FLAGS;
  });

  beforeEach(() => {
    queryClient.clear();
  });

  test('Basic Rendering', async () => {
    render(<RepoBrowser></RepoBrowser>, { wrapper: AllProviders });
    expect(screen.getByText('Azure Blob Storage')).exist;
  });

  test('Display Repository API Tile', async () => {
    const data: DataSource[] = [
      {
        type: 'API',
        name: 'api-test-name',
        account: 'api-test-account',
        container: 'api-test-container',
        description: 'API Test Description',
      },
    ];
    nock('http://localhost:3000').get('/api/datasources').reply(200, data);

    render(<RepoBrowser />, { wrapper: AllProviders });
    expect(await screen.findByText('API Test Description')).toBeInTheDocument();
  });

  test('Displays All Repository API Tiles', async () => {
    const data: DataSource[] = [
      {
        type: 'API',
        name: 'api-test-name',
        account: 'api-test-account',
        container: 'api-test-container',
        description: 'API Test Description 1',
      },
      {
        type: 'API',
        name: 'api-test-name2',
        account: 'api-test-account2',
        container: 'api-test-container2',
        description: 'API Test Description 2',
      },
    ];
    nock('http://localhost:3000').get('/api/datasources').reply(200, data);

    render(<RepoBrowser />, { wrapper: AllProviders });
    expect(await screen.findByText('API Test Description 1')).toBeInTheDocument();
    expect(await screen.findByText('API Test Description 2')).toBeInTheDocument();
  });
});

describe('Test RepositoryTile', () => {
  test('displays warning if SAS token has expired', async () => {
    const data: DataSource = {
      type: 'test-type',
      name: 'test-name',
      account: 'test-account',
      container: 'test-container',
      description: 'test description',
      sasToken: 'sp=rl&st=2022-12-24T03:00:57Z&se=2023-01-24T11:00:57Z&sv=2021-06-08',
    };
    render(<RepositoryTile item={data} />, { wrapper: AllProviders });
    expect(await screen.findByText('SAS Token is expired!')).toBeInTheDocument();
  });
});
