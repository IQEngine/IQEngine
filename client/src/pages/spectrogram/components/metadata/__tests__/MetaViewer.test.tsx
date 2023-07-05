import React from 'react';
import '@testing-library/jest-dom';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SigMFMetadata } from '@/utils/sigmfMetadata';
import { MetaViewer, MetaViewerProps } from '@/pages/spectrogram/components/metadata/MetaViewer';

describe('MetaViewer list component', () => {
  const meta = Object.assign(
    new SigMFMetadata(),
    JSON.parse(
      JSON.stringify({
        global: {
          'core:datatype': 'datatype test',
          'core:version': 'version test',
          'core:offset': 0,
          'core:sample_rate': 1,
          'core:description':
            'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        },
      })
    )
  );
  test('Renders correctly', async () => {
    render(<MetaViewer meta={meta} />);
    expect(await screen.findByText('datatype test')).toBeInTheDocument();
    expect(await screen.findByText('version test')).toBeInTheDocument();
    expect(await screen.findByText('0')).toBeInTheDocument();
    expect(await screen.findByText('1 Hz')).toBeInTheDocument();
    expect(
      await screen.findByText('lorem ipsum dolor sit amet, consectetur adipiscing elit, sed...')
    ).toBeInTheDocument();
  });
});
