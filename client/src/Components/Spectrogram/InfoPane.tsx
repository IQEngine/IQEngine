// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License
import React, { useContext, useEffect } from 'react';
import { getMeta } from '@/api/metadata/Queries';
import { SpectrogramContext } from './SpectrogramContext';

export default function InfoPane(props) {
  const spectrogramContext = useContext(SpectrogramContext);
  const { data } = getMeta(
    spectrogramContext.type,
    spectrogramContext.account,
    spectrogramContext.container,
    spectrogramContext.filePath
  );
  const meta = data;

  function titleCase(str) {
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
  }
  return (
    <div>
      {meta && meta?.global && (
        <div key={'InfoPane'}>
          {Object.entries(meta?.global).map(([key, value]) => (
            <div className="mb-3" key={key}>
              <label className="label-text text-base">
                {titleCase(key.replace('core:', '').replace(':', ' ').replace('_', ' ').replace('hw', 'Hardware'))}
              </label>
              <div className="mb-3">
                <input
                  type="text"
                  defaultValue={key === 'core:extensions' ? JSON.stringify(value) : value}
                  onChange={(event) => handleChange(event, key)}
                  size="sm"
                  className="h-8 rounded text-base-100 ml-1 pl-2"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
