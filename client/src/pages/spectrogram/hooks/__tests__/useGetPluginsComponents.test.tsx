import { useAllProviders } from '@/mocks/setupTests';
import { render, renderHook } from '@testing-library/react';
import nock from 'nock';
import { useGetPluginsComponents } from '../useGetPluginsComponents';
import React from 'react';

describe('useGetPluginsComponents', () => {
  afterEach(() => {
    nock.cleanAll();
    const { queryClient } = useAllProviders();
    queryClient.clear();
  });

  test('plugin option gets data from the plugins', async ({ expect }) => {
    const pluginTest = {
      name: 'test',
      url: 'http://localhost:3000/api/plugins/test',
    };
    const { wrapper, queryClient } = useAllProviders();
    queryClient.setQueryDefaults(['plugin', pluginTest.name], {
      staleTime: Infinity,
      cacheTime: Infinity,
    });
    queryClient.setQueryData(['plugin', pluginTest.name], ['test1', 'test2']);
    const { result } = renderHook(() => useGetPluginsComponents(), {
      wrapper: wrapper,
    });
    const PluginOption = result.current.PluginOption;
    const content = render(<PluginOption plugin={pluginTest} />, { wrapper: wrapper });
    expect(await content.findByText('test1')).toBeInstanceOf(HTMLOptionElement);
    expect(await content.findByText('test2')).toBeInstanceOf(HTMLOptionElement);
  });

  test('edit plugin parameters gets the correct inputs', async ({ expect }) => {
    const pluginUrl = 'http://localhost:8000/api/plugins/test';
    const { wrapper, queryClient } = useAllProviders();
    const parameters = {
      test1: {
        title: 'test1',
        type: 'string',
        default: 'test1',
        value: 'test1',
      },
      test2: {
        title: 'test2',
        type: 'number',
        default: 42,
        value: 42,
      },
    };
    queryClient.setQueryDefaults(['plugin', pluginUrl], {
      staleTime: Infinity,
      cacheTime: Infinity,
    });
    queryClient.setQueryData(['plugin', pluginUrl], parameters);
    const { result } = renderHook(() => useGetPluginsComponents(), {
      wrapper: wrapper,
    });
    const EditPluginParameters = result.current.EditPluginParameters;
    const content = render(
      <EditPluginParameters
        pluginUrl={pluginUrl}
        handleSubmit={(e) => {}}
        setPluginParameters={result.current.setPluginParameters}
        pluginParameters={parameters}
      />,
      {
        wrapper: wrapper,
      }
    );
    const inputs = content.container.querySelectorAll('input');
    expect(inputs.length).toBe(2);
    expect(inputs[0].name).toBe('test1');
    expect(inputs[0].value).toBe('test1');
    expect(inputs[1].name).toBe('test2');
    expect(inputs[1].value).toBe('42');
  });
});
