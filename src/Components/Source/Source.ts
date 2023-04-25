import { RecordingObject } from "Components/Recording/Recording";

export interface SourceObject {
    id: string;
    name: string;
    description: string;
    storageAccount: string;
    container: string;
    recordingsCount: number;
    recordings: RecordingObject[];
    isDefault: boolean;
}