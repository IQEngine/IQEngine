import { PluginDefinition, PluginParameters } from '@/api/Models';
import React, { useState, SetStateAction, Dispatch, useEffect } from 'react';
import { useGetPlugin, useGetPluginParameters } from '@/api/plugin/Queries';

interface PluginOptionProps {
  plugin: PluginDefinition;
}

export function PluginOption({ plugin }: PluginOptionProps) {
  const { data } = useGetPlugin(plugin);
  return (
    <optgroup label={plugin.name}>
      {data?.map((parameter) => {
        return <option value={`${plugin.url}/${parameter}`}>{parameter}</option>;
      })}
    </optgroup>
  );
}

interface PluginParametersProps {
  pluginUrl: string;
  handleSubmit: (e: any) => void;
  setPluginParameters: Dispatch<SetStateAction<PluginParameters>>;
  pluginParameters: PluginParameters;
}

export function EditPluginParameters({ pluginUrl, setPluginParameters, pluginParameters }: PluginParametersProps) {
  const { data: parameters } = useGetPluginParameters(pluginUrl);
  useEffect(() => {
    console.log('parameters', parameters);
    if (parameters) {
      for (const key in parameters) {
        parameters[key] = {
          title: key,
          type: parameters[key].type,
          default: parameters[key].default,
          value: parameters[key].default,
        };
      }
      setPluginParameters(parameters);
    }
  }, [parameters, setPluginParameters]);

  return (
    <>
      {pluginParameters && Object.keys(pluginParameters).length > 0 && (
        <>
          <div className="mb-3">
            {Object.keys(pluginParameters).map((key, index) => (
              <div key={index + 100000}>
                <label className="label pb-0">{pluginParameters[key].title}</label>
                <input
                  type={pluginParameters[key].type}
                  name={key}
                  value={pluginParameters[key].value}
                  onChange={(e) => {
                    console.log('e.target.value', e.target.value);
                    setPluginParameters((prev) => {
                      return {
                        ...prev,
                        [key]: {
                          ...prev[key],
                          value: e.target.value,
                        },
                      };
                    });
                  }}
                  className="h-8 rounded text-base-100 ml-1 pl-2"
                />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function useGetPluginsComponents() {
  const [pluginParameters, setPluginParameters] = useState<PluginParameters>(null);
  return {
    PluginOption,
    EditPluginParameters,
    pluginParameters,
    setPluginParameters,
  };
}
