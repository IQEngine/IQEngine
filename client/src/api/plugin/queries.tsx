import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PluginDefinition, PluginEndpoint, PluginParameters } from '../Models';

export function useGetPlugins() {
  return useQuery<PluginDefinition[]>(
    ['plugins'],
    async () => {
      const response = await axios.get<PluginDefinition[]>('/api/plugins/').catch((err) => {
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

export function useGetPluginDetailed(plugin: PluginDefinition) {
  return useQuery<PluginEndpoint>(
    ['plugin', plugin.name, 'detailed'],
    async () => {
      // make sure we have a trailing slash  to concatenate the url
      if (plugin.url && !plugin.url.endsWith('/')) plugin.url += '/';
      const response = await axios.get<string[]>(plugin.url);
      if (!response.data) throw new Error(`Plugin ${plugin.name} does not return correctly`);
      const result = new PluginEndpoint();
      result.name = plugin.name;
      result.url = plugin.url;
      result.plugins = {};
      for (const item of response.data) {
        const pluginUrl = new URL(item, plugin.url);
        const pluginParameters = await axios.get<PluginParameters>(pluginUrl.toString()).catch((err) => {
          console.error(`Failing getting plugin parameters from ${pluginUrl}`, err);
          return { data: null };
        });
        if (!pluginParameters.data) {
          continue;
        }
        result.plugins[item] = pluginParameters.data;
      }
      return result;
    },
    {
      enabled: !!plugin,
    }
  );
}
