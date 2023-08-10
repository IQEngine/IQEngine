import { queryClient, useAllProviders } from '@/mocks/setup-tests';
import { renderHook, waitFor } from '@testing-library/react';
import nock from 'nock';
import { useGetUsers } from '../queries';
import { vi } from 'vitest';

vi.mock('@/hooks/use-access-token', () => ({
  useAccessToken: () => 'TestToken',
}));

describe('useGetUsers', () => {
  afterEach(() => {
    nock.cleanAll();
    queryClient.clear();
  });

  test('should be able to fallback to empty array', async () => {
    let expectedPlugins = [];
    const { wrapper } = useAllProviders();

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
      .reply(500, []);

    const { result } = renderHook(() => useGetUsers(), {
      wrapper: wrapper,
    });
    await waitFor(() => expect(result.current.isError).toBe(false));
    await waitFor(() => expect(result.current.isFetching).toEqual(false), { timeout: 1000 });
    await waitFor(() => expect(result.current.data).toEqual(expectedPlugins), { timeout: 1000 });
  });

  test('should be able to get the list of users from the api', async () => {
    const { wrapper } = useAllProviders();
    let expectedUsers = [
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
    ];

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
      .reply(200, expectedUsers);

    const { result } = renderHook(() => useGetUsers(), {
      wrapper: wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.isFetching).toEqual(false), { timeout: 1000 });
    await waitFor(() => expect(result.current.data).toEqual(expectedUsers), { timeout: 1000 });
  });
});
