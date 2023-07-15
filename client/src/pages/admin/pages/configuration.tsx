import { useConfigQuery, useUpdateConfig } from '@/api/config/queries';
import React, { useCallback, useEffect } from 'react';
import { FeatureFlag } from '@/hooks/use-feature-flags';
import toast from 'react-hot-toast';

export const Configuration = () => {
  const config = useConfigQuery();
  const updateConfig = useUpdateConfig(config.data);
  const [featureFlags, setFeatureFlags] = React.useState(
    Object.fromEntries(
      Object.keys(FeatureFlag).map((key) => [FeatureFlag[key]?.name, FeatureFlag[key]?.default ?? false])
    )
  );
  const [isDirty, setIsDirty] = React.useState(false);

  useEffect(() => {
    if (config?.data?.featureFlags) {
      const newFeatureFlags = Object.fromEntries(
        Object.keys(FeatureFlag).map((key) => [
          FeatureFlag[key]?.name,
          config.data.featureFlags[FeatureFlag[key]?.name],
        ])
      );
      setFeatureFlags(newFeatureFlags);
    }
  }, [config?.data?.featureFlags]);

  const onChangeHandler = useCallback(
    (event) => {
      const { name, checked } = event.target;
      isDirty || setIsDirty(true);
      setFeatureFlags((prev) => ({ ...prev, [name]: checked }));
    },
    [setFeatureFlags]
  );

  const onSaveHandler = useCallback(() => {
    const newFeatureFlags = Object.fromEntries(
      Object.keys(FeatureFlag).map((key) => [FeatureFlag[key]?.name, featureFlags[FeatureFlag[key]?.name]])
    );
    config.data.featureFlags = newFeatureFlags;
    updateConfig.mutate(config.data, {
      onSuccess: () => {
        toast('Successfully updated configuration', {
          icon: '👍',
          className: 'bg-green-100 font-bold',
        });
      },
      onError: (response) => {
        toast('Something went wrong updating configuration', {
          icon: '😖',
          className: 'bg-red-100 font-bold',
        });
      },
    });
  }, [config, featureFlags, updateConfig]);

  return (
    <div className="card shadow-lg compact side bg-base-100">
      <h1>Configuration</h1>
      <div className="w-96">
        <h2 className="text-lg">Feature Flags</h2>
        {Object.keys(featureFlags).map((key) => (
          <div key={key}>
            <label htmlFor={key} className="label">
              <span className="text-md">{FeatureFlag[key]?.description}</span>
              {featureFlags && (
                <input
                  type="checkbox"
                  aria-label={key}
                  name={key}
                  checked={featureFlags[key]}
                  onChange={onChangeHandler}
                  className="checkbox"
                />
              )}
            </label>
          </div>
        ))}
        <button aria-label="Save Configuration Button" onClick={onSaveHandler} disabled={!isDirty} className="h-9">
          Save
        </button>
      </div>
    </div>
  );
};

export default Configuration;
