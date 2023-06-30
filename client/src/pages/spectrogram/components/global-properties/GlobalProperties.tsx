import React, { ReactElement } from 'react';
import { SigMFMetadata } from '@/utils/sigmfMetadata';

export interface GlobalPropertiesProps {
  meta: SigMFMetadata;
  setMeta: (meta: SigMFMetadata) => void;
}

export const GlobalProperties = ({ meta, setMeta }) => {
  if (!meta) return <></>;

  const globalMeta = meta.global ?? {};

  const titleCase = (str: string): string => {
    str = str.replace('core:', '').replace(':', ' ').replace('_', ' ').replace('hw', 'Hardware');
    let strArr: string[] = str.toLowerCase().split(' ');
    for (var i = 0; i < strArr.length; i++) {
      strArr[i] = strArr[i].charAt(0).toUpperCase() + strArr[i].slice(1);
    }
    return strArr.join(' ');
  };

  const stringifyObject = (key: string, value: any): string => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, undefined, 4);
    }
    return value;
  };

  const renderFormInput = (key: string, value: any): ReactElement<P> => {
    if (key.indexOf('core:description') !== -1 || (typeof value === 'object' && value !== null))
      return (
        <textarea
          name={key}
          placeholder={value}
          className="textarea pl-4 pr-4 textarea-bordered textarea-success textarea-lg w-full"
          data-testid={key}
          defaultValue={stringifyObject(key, value)}
          onChange={(event) => handleChange(event, key)}
        />
      );
    return (
      <input
        name={key}
        type="text"
        placeholder={value}
        className="input input-bordered input-success w-full"
        data-testid={key}
        defaultValue={stringifyObject(key, value)}
        onChange={(event) => handleChange(event, key)}
      />
    );
  };
  const handleChange = (e, key: string): null => {
    const { value } = e.target;
    setMeta(
      Object.assign(new SigMFMetadata(), {
        ...meta,
        global: {
          ...globalMeta,
          [key]: value,
        },
      })
    );
  };

  return (
    <div className="pr-4">
      {meta && (
        <div key={'InfoPane'}>
          {Object.entries(globalMeta).map(([key, value]) => (
            <div className="mb-3" key={key}>
              <div className="mb-3">
                <div className="form-control w-full ml-2">
                  <label className="label">
                    <span className="label-text">{titleCase(key)}</span>
                  </label>
                  {renderFormInput(key, value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalProperties;
