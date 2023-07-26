import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
      // make sure we only return in case of a string array
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

export function useGetPluginDetailed(plugin: PluginDefinition, enabled = true) {
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
      enabled: enabled && !!plugin,
    }
  );
}

export const useUpdatePlugin = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (definition: PluginDefinition) => {
      return axios.put(`/api/plugins/${definition.name}`, definition);
    },
    onMutate: async (definition: PluginDefinition) => {
      await client.cancelQueries(['plugin', definition.name]);
      const previousPlugin = client.getQueryData<PluginDefinition>(['plugin', definition.name]);
      client.setQueryData<PluginDefinition>(['plugin', definition.name], definition);
      await client.cancelQueries(['plugins']);
      const previousPlugins = client.getQueryData<PluginDefinition[]>(['plugins']);

      const updatedPlugins = Array.isArray(previousPlugins)
      ? previousPlugins.map((item) => (item.name === definition.name ? definition : item))
      : [];
      client.setQueryData<PluginDefinition[]>(['plugins'], updatedPlugins);
      return { previousPlugins, previousPlugin };
    },
    onError: (err, newDefinition, context) => {
      console.error('onError', err);
      client.setQueryData(['plugin', newDefinition.name], context.previousPlugin);
      client.setQueryData(['plugins'], context.previousPlugins);
    },
  });
};

export const useDeletePlugin = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (plugin: PluginDefinition) => {
      return axios.delete(`/api/plugins/${plugin.name}`);
    },
    onMutate: async (plugin: PluginDefinition) => {
      await client.cancelQueries(['plugins']);
      const previousPlugins = client.getQueryData<PluginDefinition[]>(['plugins']);
      client.setQueryData<PluginDefinition[]>(['plugins'], (old) => old.filter((item) => item.name !== plugin.name));
      return { previousPlugins };
    },
    onError: (err, plugin, context) => {
      console.error('onError', err);
      client.setQueryData(['plugins'], context.previousPlugins);
    },
  });
};

export const useCreatePlugin = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (plugin: PluginDefinition) => {
      return axios.post('/api/plugins/', plugin);
    },
    onMutate: async (plugin: PluginDefinition) => {
      await client.cancelQueries(['plugins']);
      const previousPlugins = client.getQueryData<PluginDefinition[]>(['plugins']);
      const updatedPlugins = Array.isArray(previousPlugins) ? [...previousPlugins, plugin] : [plugin];
      client.setQueryData<PluginDefinition[]>(['plugins'], updatedPlugins);
            return { previousPlugins };
    },
    onError: (err, plugin, context) => {
      console.error('onError', err);
      client.setQueryData(['plugins'], context.previousPlugins);
    },
  });
};
