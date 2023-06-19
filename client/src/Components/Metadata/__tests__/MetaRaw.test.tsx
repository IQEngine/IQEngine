import React from 'react';
import '@testing-library/jest-dom';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Annotation, CaptureSegment, SigMFMetadata } from '@/Utils/sigmfMetadata';
import { MetaRaw } from '@/Components/Metadata/MetaRaw';
import { AllProviders } from '@/mocks/setupTests';

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
      'core:description': 'test',
      'core:sample_start': 1000,
      'core:sample_count': 100,
    }),
  ];
  test('Renders correctly', async () => {
    render(<MetaRaw meta={meta} />, { wrapper: AllProviders });

    const textarea = screen.getByRole('textbox', { name: 'Metadata Text Area' });

    expect(textarea.innerHTML).toContain(meta.getSigMFRaw());
    expect(screen.queryByRole('button', { name: 'Download Metadata Button' })).toBeInTheDocument();
  });

  test('Displays save button when api origin', async () => {
    meta.global['traceability:origin'].type = 'api';
    render(<MetaRaw meta={meta} />, { wrapper: AllProviders });
    expect(screen.queryByRole('button', { name: 'Save Metadata Button' })).toBeInTheDocument();
  });

  test('Does not display save button when blob origin', async () => {
    meta.global['traceability:origin'].type = 'azure_blob';
    render(<MetaRaw meta={meta} />, { wrapper: AllProviders });
    expect(screen.queryByRole('button', { name: 'Save Metadata Button' })).not.toBeInTheDocument();
  });

  test('Does not display save button when local origin', async () => {
    meta.global['traceability:origin'].type = 'local';
    render(<MetaRaw meta={meta} />, { wrapper: AllProviders });
    expect(screen.queryByRole('button', { name: 'Save Metadata Button' })).not.toBeInTheDocument();
  });
});
