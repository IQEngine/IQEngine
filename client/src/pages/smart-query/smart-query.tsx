import { CLIENT_TYPE_API } from "@/api/Models";
import { useQueryTrack, useSmartQueryMeta } from "@/api/metadata/queries";
import React, { useEffect } from "react";
import { useState } from "react";
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';
import FileRow from "../recordings-browser/file";
import TrackView from "../metadata-query/geo/track-view";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export const SmartQuery = () => {
    const defaultCenter = {
        lat: 51.505,
        lng: -0.09,
    };
    const [query, setQuery] = useState<string>('');
    const mapElement = React.useRef(null)
    const [queryEnabled, setQueryEnabled] = useState<boolean>(false);
    const [position, setPosition] = useState(defaultCenter);
    const [selectedTrack, setSelectedTrack] = useState({
        account: '',
        container: '',
        filepath: '',
    });

    const [parameters, setParameters] = useState<string>('');

    const { data: smartQueryData, status: smartQueryStatus, isFetching } = useSmartQueryMeta(query, queryEnabled)

    const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value);
        setQueryEnabled(false);
    };

    useEffect(() => {
        if (smartQueryData) {
            // convert all parameters if strings to json objects 
            let tempParameters = smartQueryData["parameters"];
            for (let key in tempParameters) {
                if (key === "captures_geo_json" || key === "annotations_geo_json") {
                    if (typeof tempParameters[key] === "string") {
                        tempParameters[key] = JSON.parse(tempParameters[key]);
                    }
                }
            }
            setParameters(JSON.stringify(tempParameters, null, 2));
        }
    }, [smartQueryData]);

    const { status, data: trackData, error } = useQueryTrack(
        CLIENT_TYPE_API,
        selectedTrack.account,
        selectedTrack.container,
        selectedTrack.filepath
    );

    const [show, setShow] = useState<boolean>(trackData && trackData.length > 0);

    const handleQuery = () => {
        console.log('handleQuery');
        setQueryEnabled(true);
    };

    const handleInputQuery = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleQuery();
        }
    };

    const getCenter = () => {
        if (trackData && trackData.length > 0) {
            return trackData[(trackData.length / 2) | 0];
        }
        return defaultCenter;
    };


    const handleSetSelectedTrack = (account: string, container: string, filepath: string) => {
        setSelectedTrack({
            account: encodeURIComponent(account),
            container: encodeURIComponent(container),
            filepath: encodeURIComponent(filepath),
        });
        setShow(true);
        mapElement.current.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="flex-row p-8">
            <div className="flex justify-center">
                <input type="text" onKeyDown={handleInputQuery} placeholder="Search" className="input input-bordered w-4/5" onChange={handleQueryChange} />
                <button
                    className="btn btn-primary"
                    onClick={handleQuery}
                    type="button">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5">
                        <path
                            fill-rule="evenodd"
                            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                            clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className="flex justify-center p-8">
                {smartQueryData ? (

                    <div>
                        <details>
                            <summary className="pl-2 mt-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
                                Query Parameters
                            </summary>
                            <div className="outline outline-1 outline-primary p-2">
                                <CodeMirror
                                    className="mb-3"
                                    value={parameters}
                                    theme={vscodeDark}
                                    extensions={[langs.json()]}
                                    basicSetup={{
                                        lineNumbers: false,
                                        foldGutter: false,
                                    }}
                                />
                            </div>
                        </details>
                        <details>
                            <summary className="pl-2 mt-2 bg-primary outline outline-1 outline-primary text-lg text-base-100 hover:bg-green-800">
                                Tracks
                            </summary>
                            <div ref={mapElement}>
                                <MapContainer center={position} zoom={8} scrollWheelZoom={true}>
                                    <TrackView center={getCenter()} />
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {trackData && <Polyline pathOptions={{ color: 'red' }} positions={trackData} />}
                                </MapContainer>
                            </div>
                        </details>
                        <div className="md:px-8 xl:px-10">
                            <div className="flex justify-items-stretch text-start">
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="p-2">Spectrogram Thumbnail</th>
                                            <th className="p-2">Recording Name</th>
                                            <th className="p-2">Length in Samples</th>
                                            <th className="p-2">
                                                Data Type
                                                <a
                                                    style={{ textDecoration: 'none', color: 'white' }}
                                                    className="mr-2"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    href="https://pysdr.org/content/iq_files.html#binary-files"
                                                >
                                                    <InfoOutlinedIcon></InfoOutlinedIcon>
                                                </a>
                                            </th>
                                            <th className="p-2">Frequency</th>
                                            <th className="p-2">Sample Rate</th>
                                            <th className="p-2">Number of Annotations</th>
                                            <th className="p-2">Author</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            smartQueryData.results.map((item, i) => {
                                                return (
                                                    <FileRow
                                                        key={i}
                                                        trackToggle={(account, container, filepath) => handleSetSelectedTrack(account, container, filepath)}
                                                        queryResult={false}
                                                        geoSelected={true}
                                                        filepath={item.file_path}
                                                        account={item.account}
                                                        container={item.container}
                                                        type={item.type}
                                                    />
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        {isFetching ? (
                            <div className="flex justify-center">
                                <svg
                                    className="animate-spin ml-1 mr-3 w-96 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1"></circle>
                                    <circle className="percent fifty stroke-current text-primary" cx="12" cy="12" r="10" pathLength="100" />
                                </svg>
                            </div>
                        ) : (
                            <div>
                                No data
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
