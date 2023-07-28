import { useGetDatasources } from '@/api/datasource/hooks/use-get-datasources';
import React, { useEffect, useState } from 'react';

export const SourceQuery = ({ validator, queryName, handleQueryValid, handleQueryInvalid }) => {
  const { apiQuery } = useGetDatasources();
  const [selections, setSelections] = useState({});

  useEffect(() => {
    if (apiQuery.data) {
      const dataSources = {};

      apiQuery.data?.forEach((item) => {
        dataSources[item.name] = { name: item.name, account: item.account, container: item.container, selected: false };
      });

      setSelections(dataSources);
    }
  }, []);

  useEffect(() => {
    let checkedSelections = Object.keys(selections).filter((item) => selections[item]?.selected);
    handleSelection(checkedSelections);
  }, [selections]);

  const handleSelection = (dataSource) => {
    let dataSourcePaths = dataSource.map((value) => {
      const { account, container } = selections[value];
      return `${account}/${container}`;
    });

    const valid = validator(dataSourcePaths);
    if (valid) {
      return handleQueryValid(queryName, valid);
    }
    return handleQueryInvalid(queryName);
  };

  const toggleSelected = (e) => {
    const name = e.target.name;
    setSelections((prevSelections) => ({
      ...prevSelections,
      [name]: {
        ...prevSelections[name],
        selected: !prevSelections[name].selected,
        value: '',
      },
    }));
  };

  const toggleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelections((prevSelections) => {
      const updatedSelections = {};
      for (const item in prevSelections) {
        updatedSelections[item] = {
          ...prevSelections[item],
          selected: checked,
          value: '',
        };
      }
      return updatedSelections;
    });
  };

  const renderDataSourceSelection = () => {
    return Object.keys(selections).map((item) => {
      return (
        <label key={item} className="cursor-pointer label">
          <span className="label-text">{item}</span>
          <input
            data-testid={`checkbox-${item}`}
            onChange={toggleSelected}
            type="checkbox"
            name={item}
            checked={selections[item]?.selected || false}
            className="checkbox checkbox-success"
          />
        </label>
      );
    });
  };

  return (
    <div className="form-control">
      <label className="cursor-pointer label">
        <span className="label-text">Select All</span>
        <input
          data-testid={`checkbox-selectall`}
          onChange={toggleSelectAll}
          type="checkbox"
          checked={Object.values(selections).every((item) => item.selected) || false}
          className="checkbox checkbox-success"
        />
      </label>
      {renderDataSourceSelection()}
    </div>
  );
};
