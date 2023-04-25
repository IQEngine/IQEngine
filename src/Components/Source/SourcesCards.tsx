import React from "react";
import { SourceObject } from "./Source";

interface SourceCardsProps {
    sources: SourceObject[]
}


const SourcesCards = ({ sources }: SourceCardsProps) => {
    return (
        <>
            <h2 className="pb-2 border-bottom">Data Sources</h2>
            <div className="row g-4 py-5 row-cols-1 row-cols-lg-3">
                {sources.map((source) => (
                    <>
                        <h1>{source.name}</h1>
                        <div className="feature col">
                            <div className="feature-icon d-inline-flex align-items-center justify-content-center text-bg-primary bg-gradient fs-2 mb-3">
                            
                            </div>
                            <h3 className="fs-2">{source.name}</h3>
                            <p>{source.description}</p>
                            <a href="#" className="icon-link">
                                Call to action
                            </a>
                        </div>
                    </>
                ))}
            </div>
        </>
    );
};

export default SourcesCards;