import { PluginDefinition } from '@/api/Models';
import { useGetPlugins, useGetPluginDetailed } from '@/api/plugin/queries';
import React from 'react';

interface PluginRowProps {
  plugin: PluginDefinition;
}

export const PluginRow = ({ plugin }: PluginRowProps) => {
  const { data } = useGetPluginDetailed(plugin);
  return (
    <div className="card w-80 bg-base-100 shadow-xl border-secondary border-2">
      <div className="card-body">
        <h2 className="card-title">{plugin.name}</h2>
        <p>{plugin.url}</p>
      </div>
    </div>
  );
};

export const Plugins = () => {
  const { data } = useGetPlugins();
  return (
    <>
      <h1 className="text-3xl font-bold">Plugins</h1>
      <div className="flex flex-wrap gap-4">
        {data?.map((item, i) => (
          <PluginRow key={i} plugin={item} />
        ))}
      </div>
    </>
  );
};

export default Plugins;
