import { useAllProviders } from '@/mocks/setupTests';
import { renderHook, waitFor } from '@testing-library/react';
import nock from 'nock';
import { useGetPlugins } from '../Queries';

describe('useGetPlugins', () => {
  afterEach(() => {
    nock.cleanAll();
    const { queryClient } = useAllProviders();
    queryClient.clear();
  });

  test('should be able to fallback to empty array', async ({ expect }) => {
    let expectedPlugins = [];
    const { wrapper } = useAllProviders();
    nock('http://localhost:3000').get(`/api/plugins`).reply(500, null);

    const { result } = renderHook(() => useGetPlugins(), {
      wrapper: wrapper,
    });
    await waitFor(() => expect(result.current.isError).toBe(false));
    await waitFor(() => expect(result.current.isFetching).toEqual(false), { timeout: 1000 });
    await waitFor(() => expect(result.current.data).toEqual(expectedPlugins), { timeout: 1000 });
  });

  test('should be able to get the list of plugins from the api', async ({ expect }) => {
    const { wrapper } = useAllProviders();
    let expectedPlugins = [
      {
        name: 'builtIn',
        url: 'http://localhost:3000/api/plugins/builtIn',
      },
      {
        name: 'gnuradio',
        url: 'http://localhost:3000/api/plugins/gnuradio',
      },
    ];
    nock('http://localhost:3000').get(`/api/plugins`).reply(200, expectedPlugins);

    const { result } = renderHook(() => useGetPlugins(), {
      wrapper: wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.isFetching).toEqual(false), { timeout: 1000 });
    await waitFor(() => expect(result.current.data).toEqual(expectedPlugins), { timeout: 1000 });
  });
});
