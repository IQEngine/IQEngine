import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Plugins from '@/pages/admin/pages/plugins';
import '@testing-library/jest-dom';
import React from 'react';

describe('Test Plugins', () => {
  test('Basic Rendering', async () => {
    render(<Plugins></Plugins>);
    expect(await screen.findByRole('heading', { name: 'Plugins' })).toBeInTheDocument();
  });
});
