import { useConfigQuery } from '@/api/config/queries';
import React, { useCallback, useEffect } from 'react';
import { FeatureFlag } from '@/hooks/use-feature-flags';

export const Configuration = () => {
  const config = useConfigQuery();
  const [featureFlags, setFeatureFlags] = React.useState(
    Object.fromEntries(
      Object.keys(FeatureFlag).map((key) => [FeatureFlag[key]?.name, FeatureFlag[key]?.default ?? false])
    )
  );

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
      setFeatureFlags((prev) => ({ ...prev, [name]: checked }));
    },
    [setFeatureFlags]
  );

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
      </div>
    </div>
  );
};

export default Configuration;
