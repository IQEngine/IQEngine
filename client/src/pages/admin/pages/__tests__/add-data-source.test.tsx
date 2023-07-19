import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useAllProviders } from '@/mocks/setup-tests';
import Form from '@/pages/admin/pages/add-data-source';

describe('Test DataSources', () => {
  test('Basic Rendering', async () => {
    const { wrapper } = useAllProviders();
    render(<Form></Form>, {
      wrapper: wrapper,
    });
    expect(await screen.findByRole('heading', { name: 'Add data source' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Data Source Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Storage Account name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Container Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Image URL (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('SAS Token (optional)')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });
});
