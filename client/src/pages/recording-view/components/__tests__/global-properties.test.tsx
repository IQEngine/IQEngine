import React from 'react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAllProviders, AllProviders } from '@/mocks/setup-tests';
import { GlobalProperties } from '../global-properties';
import { SpectrogramContextProvider } from '../../hooks/use-spectrogram-context';
import nock from 'nock';
import { act } from 'react-dom/test-utils';

describe('GlobalProperties component', () => {
  const { getValidMetadata, wrapper: Wrapper } = useAllProviders();

  beforeAll(() => {
    nock('http://localhost:3000').get('/api/config').reply(200, {
      uploadPageBlobSasUrl: 'NOT A VALID SAS URL',
      internalBranding: false,
    });
  });
  test('Renders correctly', async () => {
    const metadata = getValidMetadata();
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, metadata);
    render(<GlobalProperties />, {
      wrapper: ({ children }) => (
        <AllProviders>
          <SpectrogramContextProvider
            account={metadata.getOrigin().account}
            container={metadata.getOrigin().container}
            filePath={metadata.getOrigin().file_path}
            type={metadata.getOrigin().type}
          >
            {children}
          </SpectrogramContextProvider>
        </AllProviders>
      ),
    });

    waitFor(() => expect(screen.findByTestId('core:datatype').value).toBe('datatype test'));
    waitFor(() => expect(screen.findByTestId('core:version').value).toBe('version test'));
    waitFor(() => expect(screen.findByTestId('core:offset').value).toBe('0'));
    waitFor(() => expect(screen.findByTestId('core:sample_rate').value).toBe('1'));
    waitFor(() =>
      expect(screen.getByTestId('core:description').value).toBe(
        'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      )
    );
    waitFor(() => expect(screen.findByTestId(/"type": "traceability test"/)));
    waitFor(() => expect(screen.findByTestId('traceability:sample_length').value).toBe('100'));
  });
  test('setMeta is fired on value change', async () => {
    const metadata = getValidMetadata();
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, metadata);
    render(<GlobalProperties />, {
      wrapper: ({ children }) => (
        <AllProviders>
          <SpectrogramContextProvider
            account={metadata.getOrigin().account}
            container={metadata.getOrigin().container}
            filePath={metadata.getOrigin().file_path}
            type={metadata.getOrigin().type}
          >
            {children}
          </SpectrogramContextProvider>
        </AllProviders>
      ),
    });
    const datatype = await screen.findByTestId('core:datatype');
    act(() => {
      userEvent.type(datatype, 'test1');
    });
    waitFor(() => expect(datatype.value).toBe('datatype test1'));
  });
});
