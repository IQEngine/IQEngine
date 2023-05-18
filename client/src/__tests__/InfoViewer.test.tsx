import React from 'react';
import { render, screen } from '@testing-library/react';
import { InfoViewer, InfoViewerProps } from '../Components/Spectrogram/InfoViewer';

describe('InfoViewer', () => {
    const meta: InfoViewerProps = {
        "core:datatype": "DATA",
        "core:description": "DESCRIPTION",
        "core:offset": 0,
        "core:sample_rate": 0,
        "core:version": "VERSION"
    }
    it('should render', () => {
        const { getByText } = render(<InfoViewer {...meta} />);
        expect(getByText('DATA')).toBeTruthy();
    });

    const emptyMeta = {};
    it('should render with empty props object', () => {
        const { queryByText } = render(<InfoViewer {...emptyMeta}/>);
        expect(queryByText('data type')).toBeNull(); 
    });
});
