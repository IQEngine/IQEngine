import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'

import React from 'react';

import BandSelection from '@/pages/metadata-query/BandSelection';

describe('Test BandSelection', () => {

  const mockHandle = vi.fn();
  const bands = {
    VLF: ['VLF', 3000, 30000],
    LF: ['LF', 30000, 3000000],
    MF: ['MF', 300000, 3000000],
  }

  test('Basic Rendering', () => {
    render(
      <BandSelection
        handleSelection={mockHandle}
        selected={false}
        bands={bands}
      />
    );
    expect(screen.getByText('VLF')).exist;
    expect(screen.getByText('LF')).exist;
    expect(screen.getByText('MF')).exist;
  });
});