import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Admin from '@/pages/admin/admin';
import '@testing-library/jest-dom';
import React from 'react';
import { AllProviders } from '@/mocks/setupTests';

describe('Test Admin', () => {
  test('Basic Rendering', async () => {
    render(<Admin></Admin>, { wrapper: AllProviders });
    expect(await screen.findByLabelText('Users Menu Item')).toHaveTextContent('Users');
    expect(await screen.findByLabelText('Data Sources Menu Item')).toHaveTextContent('Data Sources');
    expect(await screen.findByLabelText('Plugins Menu Item')).toHaveTextContent('Plugins');
    expect(await screen.findByLabelText('Configuration Menu Item')).toHaveTextContent('Configuration');
  });
});
