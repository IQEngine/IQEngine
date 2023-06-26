import { useAllProviders } from '@/mocks/setupTests';
import { renderHook, waitFor } from '@testing-library/react';
import nock from 'nock';
import { useGetProcessors } from '../Queries';

describe('useGetProcessors', () => {
  afterEach(() => {
    nock.cleanAll();
    const { queryClient } = useAllProviders();
    queryClient.clear();
  });

  test('should be able to fallback to empty array', async ({ expect }) => {
    let expectedProcessors = [];
    const { wrapper } = useAllProviders();
    nock('http://localhost:3000').get(`/api/processors`).reply(500, null);

    const { result } = renderHook(() => useGetProcessors(), {
      wrapper: wrapper,
    });
    await waitFor(() => expect(result.current.isError).toBe(false));
    await waitFor(() => expect(result.current.isFetching).toEqual(false), { timeout: 1000 });
    await waitFor(() => expect(result.current.data).toEqual(expectedProcessors), { timeout: 1000 });
  });

  test('should be able to get the list of processors from the api', async ({ expect }) => {
    const { wrapper } = useAllProviders();
    let expectedProcessors = [
      {
        name: 'builtIn',
        url: 'http://localhost:3000/api/processors/builtIn',
      },
      {
        name: 'gnuradio',
        url: 'http://localhost:3000/api/processors/gnuradio',
      },
    ];
    const activeMocks = nock.activeMocks();
    nock('http://localhost:3000').get(`/api/processors`).reply(200, expectedProcessors);

    const { result } = renderHook(() => useGetProcessors(), {
      wrapper: wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const active = nock.activeMocks();
    await waitFor(() => expect(result.current.isFetching).toEqual(false), { timeout: 1000 });
    await waitFor(() => expect(result.current.data).toEqual(expectedProcessors), { timeout: 1000 });
  });
});
