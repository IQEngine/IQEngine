import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import React from 'react';

import GeoQueryType from '@/pages/browser/metadata-query/geo/geo-query-type';

describe('Test BandSelection', () => {
  const mockHandle = vi.fn();
  const selected = 'annotations';

  test('Basic Rendering', () => {
    render(<GeoQueryType handleSelection={mockHandle} selected={selected} name={'captures'} />);
    const type = screen.getByLabelText('captures');
    fireEvent(
      type,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
    );
    expect(mockHandle).toHaveBeenCalledTimes(1);
    expect(mockHandle).toHaveBeenCalledWith('captures');
  });
});
