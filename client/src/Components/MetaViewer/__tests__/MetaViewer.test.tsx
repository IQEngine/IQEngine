import React from 'react';
import '@testing-library/jest-dom';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MetaViewer, MetaViewerProps } from '../MetaViewer';

describe('MetaViewer list component', () => {

    let meta: MetaViewerProps = {
        "datatype": "datatype test",
        "version": "version test",
        "offset": 0,
        "sample_rate": 1,
        "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed id elit vel nisi gravida condimentum. Suspendisse euismod tempor nunc pharetra lacinia. Suspendisse mauris justo, efficitur vel commodo non, semper ac dolor. Etiam vitae venenatis felis. Sed urna augue, dictum a ante eu, hendrerit dictum elit. Vestibulum a fringilla quam. Nam lacinia lorem vitae porttitor congue. "
    };

    test('Renders correctly', async () => {
        render(<MetaViewer {...meta} />);
        expect(await screen.findByText('datatype test')).toBeInTheDocument();
        expect(await screen.findByText('version test')).toBeInTheDocument();
        expect(await screen.findByText('0')).toBeInTheDocument();
        expect(await screen.findByText('1')).toBeInTheDocument();
        expect(await screen.findByText('Lorem ipsum dolor sit amet, consectetur adipiscing...')).toBeInTheDocument();
    });

    test('Renders untruncated description if < 50 characters', async () => {
        meta.description = 'short description';

        render(<MetaViewer {...meta} />);        
        expect(await screen.findByText('short description')).toBeInTheDocument();
    });
});