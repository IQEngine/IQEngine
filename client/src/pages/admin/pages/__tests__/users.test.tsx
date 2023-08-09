import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Users from '@/pages/admin/pages/users';
import '@testing-library/jest-dom';
import React from 'react';
import { AllProviders } from '@/mocks/setup-tests';
import nock from 'nock';

describe('Test Users', () => {
  test('Basic Rendering', async () => {
    render(<Users></Users>, { wrapper: AllProviders });
    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
  });

  test('Users Table', async () => {
    nock(`https://graph.microsoft.com`)
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
        'access-control-allow-headers': 'Authorization',
      })
      .options('/v1.0/users?$expand=memberOf')
      .reply(204);

    nock(`https://graph.microsoft.com`, {
      reqheaders: {
        Authorization: 'Bearer',
      },
    })
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/v1.0/users?$expand=memberOf')
      .reply(200, {
        value: [
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
        ],
      });

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
