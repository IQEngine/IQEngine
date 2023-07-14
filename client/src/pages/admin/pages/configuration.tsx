import { useConfigQuery } from '@/api/config/queries';
import React from 'react';

export const Configuration = () => {
  const config = useConfigQuery();
  return (
    <div className="card shadow-lg compact side bg-base-100">
      <h2>Configuration</h2>
      <div className="card-body">
        {config.data?.featureFlags &&
          Object.keys(config.data?.featureFlags).map((key, i) => (
            <div key={i}>
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">{key}</span>
                  <div className="relative">
                    <input type="checkbox" checked={config.data?.featureFlags[key]} />
                    <span className="toggle-mark"></span>
                  </div>
                </label>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Configuration;
