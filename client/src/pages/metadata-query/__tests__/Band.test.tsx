import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'

import React from 'react';

import Band from '@/pages/metadata-query/Band';

describe('Test Band', () => {

  const mockHandle = vi.fn();
  const band = ['VLF', 3000, 30000];

  test('Basic Rendering', () => {
    render(
      <Band
        handleSelection={mockHandle}
        selected={false}
        band={band}
      />
    );
    expect(screen.getByText('VLF')).exist;
  });

  test('Clicking on the component calls the handleSelection function', async () => {
    const user = userEvent.setup()
    render(
      <Band
        handleSelection={mockHandle}
        selected={false}
        band={band}
      />
    );
    const bandComponent = screen.getByText('VLF');
    await user.click(bandComponent);
    expect(mockHandle).toHaveBeenCalledTimes(1);
    expect(mockHandle).toHaveBeenCalledWith(band);
  })
});