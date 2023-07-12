import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Configuration from '@/pages/admin/components/Configuration';
import '@testing-library/jest-dom';
import React from 'react';

describe('Test Configuration', () => {
  test('Basic Rendering', async () => {
    render(<Configuration></Configuration>);
    expect(await screen.findByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
  });
});
