import { RecordingObject } from "Components/Recording/Recording";

export interface SourceObject {
    id: string;
    name: string;
    description: string;
    storageAccount: string;
    container: string;
    recordingsCount: number;
    recordings?: RecordingObject[];
    icon: string;
}


export const SampleSources: SourceObject[] = [
    {
        id: "1",
        name: "GNU Radio SigMF Repo",
        description: "A collection of example SigMF recordings hosted by the GNU Radio project (contact Marc to have your recordings added)",
        icon: "/default_spectogram.jpeg",
        container: "test",
        storageAccount: "test",
        recordingsCount: 0,
    },
    {
        id: "2",
        name: "IQEngine SigMF Repo",
        description: "A collection of example SigMF recordings hosted by the IQEngine project (contact Marc to have your recordings added)",
        icon: "/default_spectogram.jpeg",
        container: "test",
        storageAccount: "test",
        recordingsCount: 200,
    },
    {
        id: "3",
        name: "NI's LTE and 5G Examples",
        description: "Examples from NI RF data recording API: https://github.com/genesys-neu/ni-rf-data-recording-api",
        icon: "/default_spectogram.jpeg",
        container: "test",
        storageAccount: "test",
        recordingsCount: 300,
    }
];