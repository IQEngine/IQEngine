export interface RecordingObject {
    id: string;
    title: string;
    description: string;
    annotationsCount: number;
    capturesCount: number;
    source: string;
    spectogram: string;
    samples: number;
    frequency: number;
    date: string;
}



export const SampleRecordings: RecordingObject[] = [
    {
        id: '1',
        title: 'Recording 1',
        description: 'This is a recording',
        annotationsCount: 1,
        capturesCount: 1,
        source: 'Kleos',
        spectogram: '/spectogram.png',
        samples: 1000000,
        frequency: 1000000,
        date: '2021-01-01 10:00:00'
    },
    {
        id: '2',
        title: 'Recording 2',
        description: 'This is a recording',
        annotationsCount: 1,
        capturesCount: 1,
        source: 'Kleos',
        spectogram: '/spectogram.png',
        samples: 1000000,
        frequency: 1000000,
        date: '2021-01-01 10:00:00'
    },
    {
        id: '3',
        title: 'Recording 3',
        description: 'This is a recording',
        annotationsCount: 1,
        capturesCount: 1,
        source: 'Kleos',
        spectogram: '/spectogram.png',
        samples: 1000000,
        frequency: 1000000,
        date: '2021-01-01 10:00:00'
    },
];
