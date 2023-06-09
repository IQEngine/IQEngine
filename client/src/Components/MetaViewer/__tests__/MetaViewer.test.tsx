import React from 'react';
import '@testing-library/jest-dom';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MetaViewer, MetaViewerProps } from '../MetaViewer';

describe('MetaViewer list component', () => {

    const meta: MetaViewerProps = {
        "datatype": "datatype test",
        "version": "version test",
        "offset": 0,
        "sample_rate": 0,
        "description": "description test"
    };

    test('Renders correctly', async () => {
        render(<MetaViewer {...meta} />);
        expect(await screen.findByText('datatype test')).toBeInTheDocument();
    });
});