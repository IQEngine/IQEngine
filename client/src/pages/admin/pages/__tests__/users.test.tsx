import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Users from '@/pages/admin/pages/users';
import '@testing-library/jest-dom';
import React from 'react';
import { AllProviders, queryClient } from '@/mocks/setup-tests';
import nock from 'nock';

vi.mock('@/hooks/use-access-token', () => ({
  useAccessToken: () => 'TestToken',
}));

describe('Test Users', () => {
  afterEach(() => {
    nock.cleanAll();
    queryClient.clear();
  });

  test('Basic Rendering', async () => {
    render(<Users></Users>, { wrapper: AllProviders });
    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
  });

  test('Users Table', async () => {
    nock(`http://localhost:3000`)
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
        'access-control-allow-headers': 'Authorization',
      })
      .options('/api/users')
      .reply(204);

    nock(`http://localhost:3000`, {
      reqheaders: {
        Authorization: 'Bearer TestToken',
      },
    })
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/api/users')
      .reply(200, [
        {
          id: 'TestId1',
          displayName: 'Test Name 1',
          memberOf: [
            {
              displayName: 'Test Group 1',
            },
            {
              displayName: 'Test Group 2',
            },
          ],
        },
        {
          id: 'TestId2',
          displayName: 'Test Name 2',
          memberOf: [
            {
              displayName: 'Test Group 3',
            },
            {
              displayName: 'Test Group 4',
            },
          ],
        },
      ]);

    render(<Users></Users>, { wrapper: AllProviders });
    expect(await screen.findByText('Id')).toBeInTheDocument();
    expect(await screen.findByText('Display Name')).toBeInTheDocument();
    expect(await screen.findByText('Security Groups')).toBeInTheDocument();
    expect(await screen.findByText('TestId1')).toBeInTheDocument();
    expect(await screen.findByText('Test Name 1')).toBeInTheDocument();
    expect(await screen.findByText('Test Group 1')).toBeInTheDocument();
    expect(await screen.findByText('Test Group 2')).toBeInTheDocument();
    expect(await screen.findByText('TestId2')).toBeInTheDocument();
    expect(await screen.findByText('Test Name 2')).toBeInTheDocument();
    expect(await screen.findByText('Test Group 3')).toBeInTheDocument();
    expect(await screen.findByText('Test Group 4')).toBeInTheDocument();
  });
});
