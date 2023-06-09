import React from 'react'

export interface MetaViewerProps {
    "datatype": string;
    "version": string;
    "offset": number;
    "sample_rate": number;
    "description": string;
}

export const MetaViewer: React.FC<MetaViewerProps> = (meta: MetaViewerProps) => {
    const truncateDescription = (desc: string) => {
        return desc.length > 50 ? desc.substring(0, 50) + "..." : desc;
    }
    return ( 
        <div className="border border-primary ml-3 mt-2">
            <div className="flex mt-3 mb-3 stats shadow">
            <div className="stat place-items-center">
                <div className="stat-title">data type</div>
                <div className="stat-value">{meta.datatype}</div>
            </div>
            
            <div className="stat place-items-center">
                <div className="stat-title">offset</div>
                <div className="stat-value">{meta.offset}</div>
            </div>
            
            <div className="stat place-items-center">
                <div className="stat-title">sample rate</div>
                <div className="stat-value">{meta.sample_rate}</div>
            </div>
            <div className="stat place-items-center">
                <div className="stat-title">version</div>
                <div className="stat-value">{meta.version}</div>
            </div>
            <div className="stat place-items-center">
                <div className="stat-title">description</div>
                <div className="tooltip" data-tip={meta.description}>
                    <div className="stat-desc text-white">{truncateDescription(meta.description)}</div>
                </div>
            </div>
            </div>
        </div>
    )
}

export default MetaViewer;