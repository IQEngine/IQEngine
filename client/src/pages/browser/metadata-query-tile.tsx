import React from 'react';
import { useNavigate } from 'react-router-dom';

const MetadataQueryTile = (props) => {
  const navigate = useNavigate();

  return (
    <div className="repocard">
      <figure>
        <img className="repoimage" src="/query.png" alt="Metadata query tile" />
      </figure>
      <div className="repocardbody">
        <h2>Recordings Query</h2>
        Query across all metadata files
        <br />
        <div className="text-secondary">
          Use either basic filters or OpenAI's gpt-35-turbo model by providing free-form text
        </div>
        <div className="card-actions mt-8 justify-center">
          <button
            className="btn btn-primary opacity-75 w-fit"
            onClick={() => {
              navigate('/query');
            }}
            id="metadata-query-button"
            aria-label="Metadata query browse"
          >
            Basic Query
          </button>

          <button
            className="btn btn-primary opacity-75 w-fit"
            onClick={() => {
              navigate('/smart-query');
            }}
            id="smart-query-button"
            aria-label="Metadata smart query browse"
          >
            OpenAI Query
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetadataQueryTile;
