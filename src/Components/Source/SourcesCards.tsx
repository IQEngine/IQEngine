import React from 'react';
import { SourceObject } from './Source';

interface SourceCardsProps {
  sources: SourceObject[];
}

const SourcesCards = ({ sources }: SourceCardsProps) => {
  return (
    <>
      <h2 className="text-3xl font-bold underline">Collections</h2>
      <div className="row g-4 py-5 row-cols-1 row-cols-lg-3">
        {sources.map((source) => (
          <div className="feature col">
            <div className="feature-icon d-inline-flex align-items-center justify-content-center text-bg-primary bg-gradient fs-2 mb-3">
              <img height={'1em'} width={'1em'} src={source.icon} alt={source.name} />
            </div>
            <h3 className="fs-2">{source.name}</h3>
            <p>{source.description}</p>
            <a href={`/v2/source/${source.id}`} className="btn btn-primary">
              Details{' '}
            </a>
          </div>
        ))}
      </div>
    </>
  );
};

export default SourcesCards;
