import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Plugins from '@/pages/admin/pages/plugins';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useAllProviders } from '@/mocks/setup-tests';
import nock from 'nock';

describe('Test Plugins Get', () => {
  beforeEach(() => {
    nock.cleanAll();
    const { queryClient } = useAllProviders();
    queryClient.clear();
  });
  test('Basic Rendering', async () => {
    nock('http://localhost:3000')
      .get('/api/plugins/')
      .reply(200, [
        {
          name: 'Test Plugin',
          url: 'http://my.plugin.com/hello/plugins/',
        },
      ]);

    nock('http://my.plugin.com')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/hello/plugins/')
      .reply(200, []);

    const { wrapper } = useAllProviders();
    render(<Plugins></Plugins>, {
      wrapper: wrapper,
    });
    expect(await screen.findByRole('heading', { name: 'Plugins' })).toBeInTheDocument();
    expect(await screen.findByText('Test Plugin', { exact: true, selector: 'td' })).toBeInTheDocument();
    expect(
      await screen.findByText('http://my.plugin.com/hello/plugins/', { exact: true, selector: 'td' })
    ).toBeInTheDocument();
  });
  test('Basic Rendering with no plugins', async () => {
    nock('http://localhost:3000').get('/api/plugins/').reply(200, []);

    const { wrapper } = useAllProviders();
    render(<Plugins></Plugins>, {
      wrapper: wrapper,
    });
    expect(await screen.findByRole('heading', { name: 'Plugins' })).toBeInTheDocument();
    expect(await screen.findByText('No plugins found')).toBeInTheDocument();
  });

  test('Basic Rendering with plugin details', async () => {
    nock('http://localhost:3000')
      .get('/api/plugins/')
      .reply(200, [
        {
          name: 'Test Plugin',
          url: 'http://my.plugin.com/hello/plugins/',
        },
      ]);
    nock('http://my.plugin.com')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/hello/plugins/')
      .reply(200, ['first', 'second']);
    nock('http://my.plugin.com')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/hello/plugins/first/')
      .reply(200, {
        first_param1: {
          type: 'string',
          title: 'Param1',
          default: 'default',
        },
        first_param2: {
          type: 'number',
          title: 'Param2',
          default: 42,
        },
      });
    nock('http://my.plugin.com')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/hello/plugins/second/')
      .reply(200, {
        second_param1: {
          type: 'string',
          title: 'Param1',
          default: 'default',
        },
        second_param2: {
          type: 'number',
          title: 'Param2',
          default: 42,
        },
      });
    const { wrapper } = useAllProviders();
    render(<Plugins></Plugins>, {
      wrapper: wrapper,
    });
    expect(await screen.findByRole('heading', { name: 'Plugins' })).toBeInTheDocument();
    expect(await screen.findByText('Test Plugin', { exact: true, selector: 'td' })).toBeInTheDocument();
    expect(
      await screen.findByText('http://my.plugin.com/hello/plugins/', { exact: true, selector: 'td' })
    ).toBeInTheDocument();
  });
});
