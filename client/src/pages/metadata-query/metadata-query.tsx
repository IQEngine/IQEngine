import React, { useState } from 'react';
import { CLIENT_TYPE_API } from '@/api/Models';
import { useQueryTrack } from '@/api/metadata/queries';

import Results from './results';
import { queries } from './queries';

export const MetadataQuery = () => {
  const [selections, setSelections] = useState(queries);
  const [queryString, setQueryString] = useState('');
  const [geoPositionUpdate, setGeoPositionUpdate] = useState('manual');
  const [selectedTrack, setSelectedTrack] = useState({
    account: '',
    container: '',
    filepath: '',
  });
  const { status, data, error } = useQueryTrack(
    CLIENT_TYPE_API,
    selectedTrack.account,
    selectedTrack.container,
    selectedTrack.filepath
  );

  const toggleSelected = (e) => {
    const name = e.target.name;
    const newSelections = { ...selections };
    newSelections[name].selected = !newSelections[name].selected;
    newSelections[name].value = '';
    setSelections(newSelections);
  };

  const renderQuerySelection = () => {
    return Object.keys(selections).map((item) => {
      return (
        <label key={item} className="cursor-pointer label">
          <span className="label-text">{item}</span>
          <input
            onChange={toggleSelected}
            type="checkbox"
            name={item}
            checked={selections[item].selected}
            className="checkbox checkbox-success"
          />
        </label>
      );
    });
  };

  const renderQueryComponents = () => {
    return Object.keys(selections).map((item) => {
      if (selections[item].selected) {
        const Component = selections[item].component;
        if (item === 'geo') {
          return (
            <Component
              key={item}
              queryName={item}
              validator={selections[item].validator}
              description={selections[item].description}
              handleQueryValid={handleQueryValid}
              handleQueryInvalid={handleQueryInvalid}
              trackData={data ?? []}
              geoPositionUpdate={geoPositionUpdate}
              setGeoPositionUpdate={setGeoPositionUpdate}
            />
          );
        }
        return (
          <Component
            key={item}
            queryName={item}
            validator={selections[item].validator}
            description={selections[item].description}
            handleQueryValid={handleQueryValid}
            handleQueryInvalid={handleQueryInvalid}
          />
        );
      }
    });
  };

  const handleQueryValid = (name: string, value: string) => {
    const newSelections = { ...selections };
    newSelections[name].value = value;
    setSelections(newSelections);
  };

  const handleQueryInvalid = (name: string) => {
    const newSelections = { ...selections };
    newSelections[name].value = '';
    setSelections(newSelections);
  };

  const handleSetSelectedTrack = (account: string, container: string, filepath: string) => {
    setSelectedTrack({
      account: encodeURIComponent(account),
      container: encodeURIComponent(container),
      filepath: encodeURIComponent(filepath),
    });
    setGeoPositionUpdate('track');
  };

  const showQueryButton = () => {
    let empty = true;
    for (let item of Object.keys(selections)) {
      if (selections[item].selected) {
        empty = false;
      }
      if (selections[item].selected && selections[item].value === '') {
        return false;
      }
    }
    if (empty) return false;
    return true;
  };

  const renderResults = () => {
    return (
      <Results
        geoSelected={selections['geo'].selected}
        handleToggleTrack={(account, container, filepath) => handleSetSelectedTrack(account, container, filepath)}
        queryString={queryString}
      />
    );
  };

  const handleQuery = async () => {
    let query = '';
    for (let item of Object.keys(selections)) {
      if (selections[item].value) {
        query += `${selections[item].value}&`;
      }
    }
    if (!query) return;
    setQueryString(query);
  };

  return (
    <div className="m-10 mt-100">
      <h1 className="text-3xl font-bold">Field Selection</h1>
      <div className="grid grid-cols-10 gap-3">
        <div className="col-span-1">
          <div className="form-control">{renderQuerySelection()}</div>
        </div>
        <div className="col-span-9 ml-10 ">
          {renderQueryComponents()}
          <button onClick={handleQuery} disabled={!showQueryButton()}>
            QUERY
          </button>
        </div>
      </div>
      {renderResults()}
    </div>
  );
};

export default MetadataQuery;
