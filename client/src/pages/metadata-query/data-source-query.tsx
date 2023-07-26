import { useGetDatasources } from "@/api/datasource/hooks/use-get-datasources";
import { DataSourceRow } from "../admin/pages/data-sources";
import React,{ useState } from 'react';
import { queries } from './queries';


export const SourceQuery = ({ description, validator, queryName, handleQueryValid, handleQueryInvalid }) => {
    const { apiQuery, blobQuery } = useGetDatasources();
    
    
    const dataSources = {}
    const setDataSources = () => {
        {blobQuery.data?.map((item, i) => (
            dataSources[item.name] = { name: item.name, selected: false }
        ))}
    }

    const [selections, setSelections] = useState(dataSources);
        


    const toggleSelected = (e) => {
        const name = e.target.name;
        const newSelections = { ...selections };
        newSelections[name].selected = !newSelections[name].selected;
        newSelections[name].value = '';
        setSelections(newSelections);
    };

    

    const renderDataSourceSelection = () => {
        setDataSources()
        return Object.keys(dataSources).map((item) => {
            console.log(item)
            console.log(dataSources[item][1])
          return (
            <label key={item} className="cursor-pointer label">
              <span className="label-text">{item}</span>
              <input
                onChange={toggleSelected}
                type="checkbox"
                name={item}
                //checked={selections[item].selected }
                className="checkbox checkbox-success"
              />
            </label>
          );
        });
    };
    

    return( 
       <div className="form-control">{renderDataSourceSelection()}</div>
//     <div className="flex flex-wrap gap-4 pt-4 mt-2 pb-4 mb-2">
//     {apiQuery.data?.map((item, i) => (
        
//       <DataSourceRow key={i} dataSource={item} />
//     ))}
//     {blobQuery.data?.map((item, i) => (
        
//       <DataSourceRow key={i} dataSource={item} />
//     ))}
//   </div>
  );
};