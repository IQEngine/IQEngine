import '@/mocks/setup-tests';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PluginsPane, PluginsPaneProps } from '../PluginsPane';
import React from 'react';
import metadataJson from '../annotation/__tests__/AnnotationList.test.meta.json';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
//import { AllProviders } from '@/mocks/setup-tests';

describe('Plugins', () => {
  const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));

  test('Plugins pane render', async () => {
    //render(<PluginsPane timeCursorsEnabled={false} meta={meta}></PluginsPane>, { wrapper: AllProviders });
    render(<PluginsPane />);
    //expect(await screen.queryByText('Annotation')).toBeInTheDocument();
    expect(1).toEqual(3);
  });
});
