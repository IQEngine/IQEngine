import { describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Plugins from '@/pages/admin/pages/plugins';
import '@testing-library/jest-dom';
import React from 'react';
import { useAllProviders } from '@/mocks/setup-tests';

describe('Test Plugins', () => {
  test('Basic Rendering', async () => {
    const { wrapper, queryClient } = useAllProviders();
    queryClient.setQueryData(
      ['plugins'],
      [
        {
          name: 'Test Plugin',
          url: 'https://test.plugin.url/plugins/',
        },
      ]
    );
    queryClient.setQueryData(['plugin', 'Test Plugin', 'detailed'], {
      name: 'Test Plugin',
      url: 'https://test.plugin.url/plugins/',
      plugins: {
        test1: {
          title: 'Test 1',
          type: 'string',
          default: 'default',
        },
        test2: {
          title: 'Test 2',
          type: 'number',
          default: 42,
        },
      },
    });
    render(<Plugins></Plugins>, {
      wrapper: wrapper,
    });
    expect(await screen.findByRole('heading', { name: 'Plugins' })).toBeInTheDocument();
    waitFor(() => expect(screen.getByText('Test Plugin')).toBeInTheDocument());
    waitFor(() => expect(screen.getByText('https://test.plugin.url/plugins/')).toBeInTheDocument());
    waitFor(() => expect(screen.getByText('Test 1')).toBeInTheDocument());
    waitFor(() => expect(screen.getByText('Test 2')).toBeInTheDocument());
  });
});
