import React from 'react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SigMFMetadata } from '@/utils/sigmfMetadata';
import {
  GlobalProperties,
  GlobalPropertiesProps,
} from '@/pages/spectrogram/components/global-properties/GlobalProperties';

describe('GlobalProperties component', () => {
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
          'traceability:origin': { type: 'traceability test' },
          'traceability:sample_length': 100,
        },
      })
    )
  );
  const setMeta = vi.fn();
  test('Renders correctly', async () => {
    render(<GlobalProperties meta={meta} setMeta={setMeta} />);
    expect(screen.getByTestId('core:datatype').value).toBe('datatype test');
    expect(screen.getByTestId('core:version').value).toBe('version test');
    expect(screen.getByTestId('core:offset').value).toBe('0');
    expect(screen.getByTestId('core:sample_rate').value).toBe('1');
    expect(screen.getByTestId('core:description').value).toBe(
      'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    );
    expect(screen.getByText(/"type": "traceability test"/));
    expect(screen.getByTestId('traceability:sample_length').value).toBe('100');
  });
  test('setMeta is fired on value change', async () => {
    render(<GlobalProperties meta={meta} setMeta={setMeta} />);
    const datatype = screen.getByTestId('core:datatype');
    await userEvent.type(datatype, '1');
    expect(datatype.value).toBe('datatype test1');
    expect(setMeta).toHaveBeenCalledTimes(1);
    expect(setMeta).toHaveBeenCalledWith({
      ...meta,
      global: {
        ...meta.global,
        'core:datatype': 'datatype test1',
      },
    });
  });
});
