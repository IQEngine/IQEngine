import { describe, expect, test, vi } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Annotations } from '@/Features/Annotations/Annotations';
import React from 'react';
import metadataJson from './Annotations.test.meta.json';

describe('Annotations feature component', () => {
  beforeEach(() => {
    cleanup();
  });
  test('Display correct data on initial view', async () => {
    const metadata = JSON.parse(JSON.stringify(metadataJson));
    // Act
    render(<Annotations meta={metadata} totalIQSamples={20000000} updateSpectrogram={() => {}} />);

    // Assert
    expect(await screen.findByText('883.275')).toBeInTheDocument();
    expect(await screen.findByText('884.625')).toBeInTheDocument();
    expect(await screen.findByText('1.35MHz')).toBeInTheDocument();
    expect(await screen.findByText('LTE')).toBeInTheDocument();
    expect(await screen.findByText('2022-03-17T16:43:30.0025Z')).toBeInTheDocument();
    expect(await screen.findByText('2022-03-17T16:43:30.0075Z')).toBeInTheDocument();
    expect(await screen.findByText('5ms')).toBeInTheDocument();
  });

  test.each`
    input                          | label                               | type            | expected                                                              | number
    ${'0'}                         | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${'Frequency must be greater than the minimum frequency of the file'} | ${1}
    ${'8888'}                      | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${'Frequency must be less than the maximum frequency of the file'}    | ${2}
    ${'0'}                         | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${'Frequency must be greater than the minimum frequency of the file'} | ${3}
    ${'8888'}                      | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${'Frequency must be less than the maximum frequency of the file'}    | ${4}
    ${'2022-03-17T16:42:30.0000Z'} | ${'Annotation 0 - Start Time'}      | ${'textbox'}    | ${'Date must be after start of the file'}                             | ${5}
    ${'2022-03-17T16:45:30.0000Z'} | ${'Annotation 0 - Start Time'}      | ${'textbox'}    | ${'Date must be before end of the file'}                              | ${6}
    ${'Invalid date'}              | ${'Annotation 0 - Start Time'}      | ${'textbox'}    | ${'Invalid date'}                                                     | ${7}
    ${'2022-03-17T16:42:30.0000Z'} | ${'Annotation 0 - End Time'}        | ${'textbox'}    | ${'Date must be after start of the file'}                             | ${8}
    ${'2022-03-17T16:45:30.0000Z'} | ${'Annotation 0 - End Time'}        | ${'textbox'}    | ${'Date must be before end of the file'}                              | ${9}
    ${'Invalid date'}              | ${'Annotation 0 - End Time'}        | ${'textbox'}    | ${'Invalid date'}                                                     | ${10}
  `('Annotation errors display correctly', async ({ input, label, type, expected }) => {
    //Arrange
    //Javascript keeps modifying the metadata object, so we have to make a copy of it
    const metadata = JSON.parse(JSON.stringify(metadataJson));
    render(<Annotations meta={metadata} totalIQSamples={20000000} updateSpectrogram={() => {}} />);

    // Act
    const start = await screen.findByRole(type, { name: label });

    expect(screen.queryByText(expected)).not.toBeInTheDocument();
    await userEvent.clear(start);
    await userEvent.type(start, input);
    await userEvent.tab();

    // Assert
    expect((await screen.findAllByText(expected))[0]).toBeInTheDocument();
  });

  test.each`
    input                         | label                               | type            | expected
    ${'883'}                      | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${'883'}
    ${'883'}                      | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${'1.625MHz'}
    ${'885'}                      | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${'885'}
    ${'885'}                      | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${'1.725MHz'}
    ${'2022-03-17T16:43:30.002Z'} | ${'Annotation 0 - Start Time'}      | ${'textbox'}    | ${'2022-03-17T16:43:30.002Z'}
    ${'2022-03-17T16:45:30.003Z'} | ${'Annotation 0 - End Time'}        | ${'textbox'}    | ${'2022-03-17T16:45:30.003Z'}
  `('Annotation updates values correctly', async ({ input, label, type, expected }) => {
    //Arrange
    //Javascript keeps modifying the metadata object, so we have to make a copy of it
    const metadata = JSON.parse(JSON.stringify(metadataJson));
    render(<Annotations meta={metadata} totalIQSamples={20000000} updateSpectrogram={() => {}} />);

    expect(await screen.queryByText(expected)).not.toBeInTheDocument();

    // Act
    const start = await screen.findByRole(type, { name: label });
    await userEvent.clear(start);
    await userEvent.type(start, input);
    await userEvent.tab();

    // Assert
    expect((await screen.findAllByText(expected))[0]).toBeInTheDocument();
  });
});
