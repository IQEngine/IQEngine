import { useAllProviders } from '@/mocks/setupTests';
import { renderHook, waitFor } from '@testing-library/react';
import nock from 'nock';
import { useGetPlugins, useGetPlugin, useGetPluginParameters } from '../Queries';

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

    import.meta.env.IQENGINE_PLUGINS = JSON.stringify(expectedPlugins);
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

  test('should be able to get the list of plugins from the env', async ({ expect }) => {
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
    nock('http://localhost:3000').get(`/api/plugins`).reply(500, null);
    process.env.IQENGINE_PLUGINS = JSON.stringify(expectedPlugins);

    const { result } = renderHook(() => useGetPlugins(), {
      wrapper: wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.isFetching).toEqual(false), { timeout: 1000 });
    await waitFor(() => expect(result.current.data).toEqual(expectedPlugins), { timeout: 1000 });
  });
});

describe('useGetPlugin', () => {
  afterEach(() => {
    nock.cleanAll();
    const { queryClient } = useAllProviders();
    queryClient.clear();
  });

  test('should be able to get the list of plugins from one pluging config', async ({ expect }) => {
    const { wrapper } = useAllProviders();
    let expectedPlugins = ['plugin1', 'plugin2'];
    nock('http://localhost:8000')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get(`/api/plugins`)
      .reply(200, expectedPlugins);
    const { result } = renderHook(() => useGetPlugin({ name: 'gnuradio', url: 'http://localhost:8000/api/plugins' }), {
      wrapper: wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 1000 });
    await waitFor(() => expect(result.current.isFetching).toEqual(false), { timeout: 1000 });
    await waitFor(() => expect(result.current.data).toEqual(expectedPlugins), { timeout: 1000 });
  });

  test('should be able to get the list of plugins from one pluging config', async ({ expect }) => {
    const { wrapper } = useAllProviders();
    let expectedPlugins = ['plugin1', 'plugin2'];
    nock('http://localhost:8000')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get(`/api/plugins`)
      .reply(200, { error: 'error' });
    const { result } = renderHook(() => useGetPlugin({ name: 'gnuradio', url: 'http://localhost:8000/api/plugins' }), {
      wrapper: wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(false), { timeout: 1000 });
    await waitFor(() => expect(result.current.isFetching).toEqual(false), { timeout: 1000 });
    await waitFor(() => expect(result.current.data).toEqual(undefined), { timeout: 1000 });
  });
});

describe('useGetPluginParameters', () => {
  afterEach(() => {
    nock.cleanAll();
    const { queryClient } = useAllProviders();
    queryClient.clear();
  });

  test('should be able to get parameters from a plugin', async ({ expect }) => {
    const { wrapper } = useAllProviders();
    let expectedParameters = {
      param1: {
        title: 'Param1',
        type: 'string',
        default: 'default',
      },
      param2: {
        title: 'Param2',
        type: 'number',
        default: 42,
      },
    };
    nock('http://localhost:8000')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get(`/api/plugins/plugin1`)
      .reply(200, expectedParameters);
    const { result } = renderHook(() => useGetPluginParameters('http://localhost:8000/api/plugins/plugin1'), {
      wrapper: wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 1000 });
    await waitFor(() => expect(result.current.isFetching).toEqual(false), { timeout: 1000 });
    await waitFor(() => expect(result.current.data).toEqual(expectedParameters), { timeout: 1000 });
  });
});
