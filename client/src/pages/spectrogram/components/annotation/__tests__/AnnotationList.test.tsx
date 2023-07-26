import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AnnotationList } from '@/pages/spectrogram/components/annotation/AnnotationList';
import React from 'react';
import metadataJson from './AnnotationList.test.meta.json';
import { SigMFMetadata } from '@/utils/sigmfMetadata';

describe('Annotation list component', () => {
  test('Columns display correctly', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));

    // Act
    render(
      <AnnotationList meta={meta} setHandleTop={() => {}} spectrogramHeight={200} setMeta={() => {}}></AnnotationList>
    );

    // Assert column are in document
    expect(await screen.queryByText('Time Range')).toBeInTheDocument();
    expect(await screen.queryByText('Annotation')).toBeInTheDocument();
    expect(await screen.queryByText('Frequency Range')).toBeInTheDocument();
    expect(await screen.queryByText('BW')).toBeInTheDocument();
    expect(await screen.queryByText('Label')).toBeInTheDocument();
    expect(await screen.queryByText('Duration')).toBeInTheDocument();
    expect(await screen.queryByText('Actions')).toBeInTheDocument();
  });

  test('Columns display correctly when no capture date time', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    delete meta.captures[0]['core:datetime'];

    // Act
    render(
      <AnnotationList meta={meta} setHandleTop={() => {}} spectrogramHeight={200} setMeta={() => {}}></AnnotationList>
    );

    // Assert column are in document
    expect(await screen.queryByText('Time Range')).not.toBeInTheDocument();

    // Assert columns are in document
    expect(await screen.queryByText('Annotation')).toBeInTheDocument();
    expect(await screen.queryByText('Frequency Range')).toBeInTheDocument();
    expect(await screen.queryByText('BW')).toBeInTheDocument();
    expect(await screen.queryByText('Label')).toBeInTheDocument();
    expect(await screen.queryByText('Duration')).toBeInTheDocument();
    expect(await screen.queryByText('Actions')).toBeInTheDocument();

    // Assert values are in document
    expect(await screen.findByText('883.275')).toBeInTheDocument();
    expect(await screen.findByText('884.625')).toBeInTheDocument();
    expect(await screen.findByText('1.35MHz')).toBeInTheDocument();
    expect(await screen.findByText('LTE')).toBeInTheDocument();
    expect(await screen.findByText('5ms')).toBeInTheDocument();
    expect(await screen.findByText('Sample comment')).toBeInTheDocument();
  });

  test.each`
    input                         | column
    ${'invalid date'}             | ${'Time Range'}
    ${'2022-03-17T16:43:30.0025'} | ${'Time Range'}
  `('Hide column and value when invalid', async ({ input }) => {
    // Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    meta.captures[0]['core:datetime'] = input;

    // Act
    render(
      <AnnotationList meta={meta} setHandleTop={() => {}} spectrogramHeight={200} setMeta={() => {}}></AnnotationList>
    );

    // Assert column not in document
    expect(await screen.queryByText('Time Range')).not.toBeInTheDocument();

    // Assert values not in document
    expect(await screen.queryByText('Time Range')).not.toBeInTheDocument();
    expect(await screen.queryByText(input)).not.toBeInTheDocument();

    // Assert columns are in document
    expect(await screen.queryByText('Annotation')).toBeInTheDocument();
    expect(await screen.queryByText('Frequency Range')).toBeInTheDocument();
    expect(await screen.queryByText('BW')).toBeInTheDocument();
    expect(await screen.queryByText('Label')).toBeInTheDocument();
    expect(await screen.queryByText('Duration')).toBeInTheDocument();
    expect(await screen.queryByText('Actions')).toBeInTheDocument();

    // Assert values are in document
    expect(await screen.findByText('883.275')).toBeInTheDocument();
    expect(await screen.findByText('884.625')).toBeInTheDocument();
    expect(await screen.findByText('1.35MHz')).toBeInTheDocument();
    expect(await screen.findByText('LTE')).toBeInTheDocument();
    expect(await screen.findByText('5ms')).toBeInTheDocument();
  });

  test('Display correct data on initial view', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));

    render(
      <AnnotationList meta={meta} setHandleTop={() => {}} spectrogramHeight={200} setMeta={() => {}}></AnnotationList>
    );

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
  `('Annotation errors display correctly on tab escape', async ({ input, label, type, expected }) => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));

    render(
      <AnnotationList meta={meta} setHandleTop={() => {}} spectrogramHeight={200} setMeta={() => {}}></AnnotationList>
    );

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
  `('Annotation errors display correctly on enter', async ({ input, label, type, expected }) => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));

    render(
      <AnnotationList meta={meta} setHandleTop={() => {}} spectrogramHeight={200} setMeta={() => {}}></AnnotationList>
    );

    // Act
    const start = await screen.findByRole(type, { name: label });

    expect(screen.queryByText(expected)).not.toBeInTheDocument();
    await userEvent.clear(start);
    await userEvent.type(start, input + '[Enter]');

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
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));

    render(
      <AnnotationList meta={meta} setHandleTop={() => {}} spectrogramHeight={200} setMeta={() => {}}></AnnotationList>
    );

    // Act
    expect(await screen.queryByText(expected)).not.toBeInTheDocument();

    const start = await screen.findByRole(type, { name: label });
    await userEvent.clear(start);
    await userEvent.type(start, input);
    await userEvent.tab();

    // Assert
    expect((await screen.findAllByText(expected))[0]).toBeInTheDocument();
  });

  test.each`
    input                         | key                       | value            | label                               | type            | expected
    ${'883'}                      | ${'core:freq_lower_edge'} | ${883000000}     | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${883000000}
    ${'885'}                      | ${'core:freq_upper_edge'} | ${885000000}     | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${885000000}
    ${'New Label'}                | ${'core:label'}           | ${'New Label'}   | ${'Annotation 0 - Label'}           | ${'textbox'}    | ${'New Label'}
    ${'2022-03-17T16:43:30.002Z'} | ${'core:sample_start'}    | ${10001}         | ${'Annotation 0 - Start Time'}      | ${'textbox'}    | ${10001}
    ${'2022-03-17T16:45:30.003Z'} | ${'core:sample_count'}    | ${10002}         | ${'Annotation 0 - End Time'}        | ${'textbox'}    | ${10002}
    ${'New Comment'}              | ${'core:comment'}         | ${'New Comment'} | ${'Annotation 0 - Comment'}         | ${'textbox'}    | ${'New Comment'}
  `('Annotation updates action value correctly on alteration', async ({ input, key, value, label, type, expected }) => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));

    render(
      <AnnotationList
        meta={meta}
        setHandleTop={() => {}}
        spectrogramHeight={200}
        setMeta={() => {
          meta.annotations[0][key] = value;
        }}
      ></AnnotationList>
    );

    // Act
    expect(await screen.queryByText(expected)).not.toBeInTheDocument();

    const start = await screen.findByRole(type, { name: label });
    await userEvent.clear(start);
    await userEvent.type(start, input);
    await userEvent.tab();

    const openButton = await screen.findByLabelText('Annotation 0 Modal Open');
    await userEvent.click(openButton);

    // Assert
    const textarea = await screen.findByLabelText('Annotation 0 Modal');
    expect(textarea.innerHTML).toContain(expected);
  });

  test.each`
    key                       | label                               | type            | expected
    ${'core:freq_lower_edge'} | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${860}
    ${'core:freq_upper_edge'} | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${900}
  `('When no frequencies, display default value', async ({ key, label, type, expected }) => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    delete meta.annotations[0][key];

    //Act
    render(
      <AnnotationList
        meta={meta}
        setHandleTop={() => {}}
        spectrogramHeight={200}
        setMeta={() => {
          delete meta.annotations[0][key];
        }}
      ></AnnotationList>
    );

    // Assert
    const current = await screen.findByRole(type, { name: label });
    expect(current).toHaveValue(expected);
  });

  test.each`
    key                       | label                               | type            | expected
    ${'core:freq_lower_edge'} | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${-20}
    ${'core:freq_upper_edge'} | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${20}
  `('When no frequencies or center frequency, display default value', async ({ key, label, type, expected }) => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    delete meta.annotations[0][key];
    delete meta.captures[0]['core:frequency'];

    //Act
    render(
      <AnnotationList
        meta={meta}
        setHandleTop={() => {}}
        spectrogramHeight={200}
        setMeta={() => {
          delete meta.annotations[0][key];
        }}
      ></AnnotationList>
    );

    // Assert
    const current = await screen.findByRole(type, { name: label });
    expect(current).toHaveValue(expected);
  });
});
