import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataSources from '@/pages/admin/pages/data-sources';
import '@testing-library/jest-dom';
import React from 'react';
import { useAllProviders } from '@/mocks/setup-tests';
import { ClientType, DataSource } from '@/api/Models';

describe('Test DataSources', () => {
  test('Basic Rendering', async () => {
    const { wrapper, queryClient } = useAllProviders();
    queryClient.setQueryData(
      ['datasource', ClientType.BLOB],
      [
        {
          type: ClientType.BLOB,
          name: 'Test Blob',
          description: 'Test Blob Description',
          imageURL: 'https://test.blob.core.windows.net/test/test.png',
          account: 'test',
          container: 'test',
          sasToken: 'test',
        },
      ]
    );
    queryClient.setQueryData(
      ['datasource', ClientType.API],
      [
        {
          type: ClientType.API,
          name: 'Test API',
          description: 'Test API Description',
          imageURL: 'https://test.blob.core.windows.net/api/test.png',
          account: 'test',
          container: 'test',
          sasToken: 'test',
        },
      ]
    );
    render(<DataSources></DataSources>, {
      wrapper: wrapper,
    });
    expect(await screen.findByRole('heading', { name: 'Data Sources' })).toBeInTheDocument();
    expect(screen.getByText('Test Blob')).toBeInTheDocument();
    expect(screen.getByText('Test Blob Description')).toBeInTheDocument();
    expect(screen.getByText(ClientType.BLOB)).toBeInTheDocument();
    const imageBlob = screen.getByAltText('Test Blob Description');
    expect(imageBlob).toBeInTheDocument();
    expect(imageBlob).toHaveAttribute('src', 'https://test.blob.core.windows.net/test/test.png');

    expect(screen.getByText('Test API')).toBeInTheDocument();
    expect(screen.getByText('Test API Description')).toBeInTheDocument();
    expect(screen.getByText(ClientType.API)).toBeInTheDocument();
    const imageAPI = screen.getByAltText('Test API Description');
    expect(imageAPI).toBeInTheDocument();
    expect(imageAPI).toHaveAttribute('src', 'https://test.blob.core.windows.net/api/test.png');
  });
});
