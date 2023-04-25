import React from "react";
import { SourceObject } from "./Source";
import Nav from "react-bootstrap/esm/Nav";

interface SourceCardsProps {
    sources: SourceObject[]
}


const SourcesCards = ({ sources }: SourceCardsProps) => {
    return (
        <>
            <h2 className="pb-2 border-bottom">Collections</h2>
            <div className="row g-4 py-5 row-cols-1 row-cols-lg-3">
                {sources.map((source) => (
                    <div className="feature col">
                        <div className="feature-icon d-inline-flex align-items-center justify-content-center text-bg-primary bg-gradient fs-2 mb-3">
                            <img height={"1em"} width={"1em"} src={source.icon} alt={source.name} />
                        </div>
                        <h3 className="fs-2">{source.name}</h3>
                        <p>{source.description}</p>
                        <Nav.Link href={`/v2/source/${source.id}`} className="btn btn-primary">Details </Nav.Link>
                    </div>
                ))}
            </div>
        </>
    );
};

export default SourcesCards;