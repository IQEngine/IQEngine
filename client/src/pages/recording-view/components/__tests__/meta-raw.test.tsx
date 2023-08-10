import React from 'react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Annotation, CaptureSegment, SigMFMetadata } from '@/utils/sigmfMetadata';
import { MetaRaw } from '../meta-raw';
import { AllProviders } from '@/mocks/setup-tests';
import userEvent from '@testing-library/user-event';
import nock from 'nock';
import '@azure/msal-react';

describe('MetaRaw ', () => {
  const meta: SigMFMetadata = Object.assign(new SigMFMetadata(), {
    global: {
      'core:author': 'TestAuthor',
      'core:datatype': 'cf32_le',
      'core:sample_rate': 1e6,
      'core:version': '0.0.1',
      'core:num_channels': 2,
      'traceability:origin': {
        type: 'api',
        account: 'gnuradio',
        container: 'iqengine',
        file_path: 'bluetooth',
      },
    },
  });
  meta.captures = [
    Object.assign(new CaptureSegment(), {
      'core:sample_start': 0,
    }),
  ];
  meta.annotations = [
    Object.assign(new Annotation(), {
      'core:label': 'test',
      'core:sample_start': 1000,
      'core:sample_count': 100,
    }),
  ];

  beforeEach(() => {
    vi.mock('@azure/msal-react', async () => {
      return {
        useMsal: () => {
          return {
            instance: {
              getActiveAccount: () => {
                return {
                  name: 'test',
                };
              },
            },
          };
        },
      };
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('Renders correctly', async () => {
    render(<MetaRaw meta={meta} />, { wrapper: AllProviders });
    expect(screen.queryByRole('button', { name: 'Download Metadata' })).toBeInTheDocument();
  });

  test('Displays save button when api origin', async () => {
    meta.global['traceability:origin'].type = 'api';
    render(<MetaRaw meta={meta} />, { wrapper: AllProviders });
    expect(screen.queryByRole('button', { name: 'Save Metadata' })).toBeInTheDocument();
  });

  test('Does not display save button when blob origin', async () => {
    meta.global['traceability:origin'].type = 'azure_blob';
    render(<MetaRaw meta={meta} />, { wrapper: AllProviders });
    expect(screen.queryByRole('button', { name: 'Save Metadata' })).not.toBeInTheDocument();
  });

  test('Does not display save button when local origin', async () => {
    meta.global['traceability:origin'].type = 'local';
    render(<MetaRaw meta={meta} />, { wrapper: AllProviders });
    expect(screen.queryByRole('button', { name: 'Save Metadata' })).not.toBeInTheDocument();
  });

  test('Displays save successful message when successful update', async () => {
    meta.global['traceability:origin'].type = 'api';

    nock('http://localhost:3000').put(`/api/datasources/gnuradio/iqengine/bluetooth/meta`).reply(204);

    render(<MetaRaw meta={meta} />, { wrapper: AllProviders });

    const saveButton = screen.getByRole('button', { name: 'Save Metadata' });
    await userEvent.click(saveButton);

    expect(await screen.findByText('Successfully updated metadata')).toBeInTheDocument();
  });

  test('Displays save unsuccessful message when error on update', async () => {
    meta.global['traceability:origin'].type = 'api';

    nock('http://localhost:3000').put(`/api/datasources/gnuradio/iqengine/bluetooth/meta`).reply(404);

    render(<MetaRaw meta={meta} />, { wrapper: AllProviders });

    const saveButton = screen.getByRole('button', { name: 'Save Metadata' });
    await userEvent.click(saveButton);

    expect(await screen.findByText('Something went wrong updating metadata')).toBeInTheDocument();
  });
});
