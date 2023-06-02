// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License
import React from 'react';
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/Store/hooks';
import { setMetaGlobal } from '@/Store/Reducers/FetchMetaReducer';

export default function InfoPane(props) {
  const metaGlobal = useAppSelector((state) => state.meta.global);
  const [newMetaGlobal, setNewMetaGlobal] = useState(metaGlobal);
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();

  useEffect(() => {
    setNewMetaGlobal(metaGlobal);
  }, [metaGlobal]);

  function titleCase(str) {
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
  }

  // updates InfoPane state
  const handleChange = (event, key) => {
    var value = event.target.value;
    var newMeta = { ...newMetaGlobal };
    if (key === 'core:extensions') {
      try {
        value = JSON.parse(value);
        setError('');
      } catch (_) {
        setError('Not a valid JSON, please try again');
        return;
      }
    }
    newMeta[key] = value;
    setNewMetaGlobal(newMeta);
  };

  // updates SpectrogramPage state
  function handleClick() {
    dispatch(setMetaGlobal(newMetaGlobal));
  }

  return (
    <div>
      <div key={'InfoPane'}>
        {Object.entries(metaGlobal).map(([key, value]) => (
          <div className="mb-3" key={key}>
            <label className="label-text text-base">
              {titleCase(key.replace('core:', '').replace(':', ' ').replace('_', ' ').replace('hw', 'Hardware'))}
            </label>
            {key === 'core:extensions' && <div style={{ color: 'red' }}>{error}</div>}
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
        <button className="btn btn-primary" onClick={handleClick} disabled={error.length > 0}>
          Save
        </button>
      </div>
    </div>
  );
}
