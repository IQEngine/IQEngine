import React from 'react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Annotation, CaptureSegment, SigMFMetadata } from '@/utils/sigmfMetadata';
import { MetaRaw } from '../meta-raw';
import { AllProviders } from '@/mocks/setup-tests';
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
                return null;
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

  test('Does not display save button when api origin and no account', async () => {
    meta.global['traceability:origin'].type = 'api';

    render(<MetaRaw meta={meta} />, { wrapper: AllProviders });
    expect(screen.queryByRole('button', { name: 'Save Metadata' })).not.toBeInTheDocument();
  });
});
