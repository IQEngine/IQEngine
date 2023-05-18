import React from 'react';

export interface InfoViewerProps {
  "core:datatype": string;
  "core:description": string;
  "core:offset": number;
  "core:sample_rate": number;
  "core:version": string;
}

export const InfoViewer = ( meta : InfoViewerProps) => {
    if(Object.keys(meta).length === 0 && meta.constructor === Object) {
      return <></>
    }
    return (
      <div className="indicator p-1 mt-3 ml-1 mr-1">
        <div className="card border-1 border-iqengine-green rounded-md">
          <div className="card-body">
          <table className="table w-full">
                <thead>
                  <tr>
                    <th>data type</th>
                    <th>description</th>
                    <th>sample_rate Color</th>
                    <th>version</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>{meta['core:datatype']}</th>
                    <td>{meta['core:description']}</td>
                    <td>{meta['core:sample_rate']}</td>
                    <td>{meta['core:version']}</td>
                  </tr>
                </tbody>
              </table>
          </div>
        </div>
      </div>
    );
};

export default InfoViewer