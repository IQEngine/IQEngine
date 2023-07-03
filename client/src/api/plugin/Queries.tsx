import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PluginDefinition, PluginParameters } from '../Models';

export function useGetPlugins() {
  return useQuery<PluginDefinition[]>(
    ['plugins'],
    async () => {
      const response = await axios.get<PluginDefinition[]>('/api/plugins').catch((err) => {
        console.error('Failing getting plugins from api', err);
        if (import.meta.env.IQENGINE_PLUGINS) {
          const plugins = JSON.parse(import.meta.env.IQENGINE_PLUGINS);
          return { data: plugins };
        } else {
          return { data: [] };
        }
      });
      return response.data;
    },
    {
      placeholderData: [],
    }
  );
}

export function useGetPlugin(plugin: PluginDefinition) {
  return useQuery<string[]>(
    ['plugin', plugin.name],
    async () => {
      const response = await axios.get<string[]>(plugin.url);
      // make sure we onlyt return in case of a string array
      if (!Array.isArray(response.data)) throw new Error(`Plugin ${plugin.name} does not return a string array`);
      return response.data;
    },
    {
      enabled: !!plugin,
    }
  );
}

export function useGetPluginParameters(pluginUrl: string) {
  return useQuery<PluginParameters>(
    ['plugin', 'parameters', pluginUrl],
    async () => {
      const response = await axios.get<PluginParameters>(pluginUrl);
      return response.data;
    },
    {
      enabled: !!pluginUrl,
    }
  );
}
