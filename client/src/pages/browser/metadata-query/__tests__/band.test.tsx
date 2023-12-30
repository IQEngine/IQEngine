import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import React from 'react';

import Band from '@/pages/browser/metadata-query/band';

describe('Test Band', () => {
  const mockHandle = vi.fn();
  const band = ['MF', 3000, 30000];

  test('Basic Rendering', () => {
    render(<Band handleSelection={mockHandle} selected={false} band={band} />);
    expect(screen.getByText('MF')).exist;
  });

  test('Clicking on the component calls the handleSelection function', async () => {
    const user = userEvent.setup();
    render(<Band handleSelection={mockHandle} selected={false} band={band} />);
    const bandComponent = screen.getByText('MF');
    await user.click(bandComponent);
    expect(mockHandle).toHaveBeenCalledTimes(1);
    expect(mockHandle).toHaveBeenCalledWith(band);
  });
});
