import * as React from 'react';
import RecordingList from 'Components/Recording/RecordingList';
import SourcesCards from 'Components/Source/SourcesCards';

function Home() {
    
    return (
        <>
            <SourcesCards sources={[]} />
            <RecordingList />
        </>
    );
}

export default Home;