import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import React from 'react';

import BandSelection from '@/pages/browser/metadata-query/band-selection';

describe('Test BandSelection', () => {
  const mockHandle = vi.fn();
  const bands = {
    MF: ['MF', 300000, 3000000],
    HF: ['HF', 3000000, 30000000],
    VHF: ['VHF', 30000000, 300000000],
  };

  test('Basic Rendering', () => {
    render(<BandSelection handleSelection={mockHandle} selected={false} bands={bands} />);
    expect(screen.getByText('MF')).exist;
    expect(screen.getByText('HF')).exist;
    expect(screen.getByText('VHF')).exist;
  });
});
