import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import DataSources from '@/pages/admin/pages/data-sources';
import '@testing-library/jest-dom';
import React from 'react';

describe('Test DataSources', () => {
  test('Basic Rendering', async () => {
    render(<DataSources></DataSources>);
    expect(await screen.findByRole('heading', { name: 'Data Sources' })).toBeInTheDocument();
  });
});
