import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import React from 'react';

import GeoQueryTypes from '@/pages/metadata-query/geo/geo-query-types';

describe('Test GeoQueryTypes', () => {
  const mockHandle = vi.fn();
  const types = ['captures', 'annotations'];

  test('Basic Rendering', () => {
    render(<GeoQueryTypes handleSelection={mockHandle} selected={'annotations'} types={types} />);
    expect(screen.getByText('captures')).exist;
    expect(screen.getByText('annotations')).exist;
  });
});
