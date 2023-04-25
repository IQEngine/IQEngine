import * as React from 'react';
import RecordingList from 'Components/Recording/RecordingList';
import SourcesCards from 'Components/Source/SourcesCards';
import { SampleSources } from 'Components/Source/Source';
import { SampleRecordings } from 'Components/Recording/Recording';


function Home() {
    
    return (
        <>
            <SourcesCards sources={SampleSources} />
            <RecordingList recordings={SampleRecordings} />
        </>
    );
}

export default Home;