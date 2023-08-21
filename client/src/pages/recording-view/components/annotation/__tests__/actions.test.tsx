import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Actions } from '../actions';
import React from 'react';
import metadataJson from './annotation-list.test.meta.json';
import { Annotation, SigMFMetadata } from '@/utils/sigmfMetadata';

describe('Annotation list component', () => {
  test('Annotations modal is not visible on initial render', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    const annotations = meta.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
    meta.annotations = annotations;

    render(
      <Actions
        meta={meta}
        index={0}
        fftSize={1024}
        startSampleCount={10}
        setCurrentFFT={() => {}}
        setMeta={() => {}}
        setSelectedAnnotation={() => {}}
      ></Actions>
    );

    // Act
    const modal = screen.queryByLabelText('Annotation 0');

    //Assert
    expect(modal).not.toBeInTheDocument();
  });

  test('Annotations modal is visible on toggle', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    const annotations = meta.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
    meta.annotations = annotations;

    render(
      <Actions
        meta={meta}
        index={0}
        fftSize={1024}
        startSampleCount={10}
        setCurrentFFT={() => {}}
        setMeta={() => {}}
        setSelectedAnnotation={() => {}}
      ></Actions>
    );

    // Act
    const openButton = await screen.findByLabelText('Annotation 0 Modal Open');
    await userEvent.click(openButton);

    // Assert
    const modal = await screen.findByLabelText('Annotation 0', { selector: 'dialog' });
    expect(modal).toHaveClass('modal-open');
  });

  test('Annotations modal displays annotation', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    const annotations = meta.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
    meta.annotations = annotations;

    // Act
    render(
      <Actions
        meta={meta}
        index={0}
        fftSize={1024}
        startSampleCount={10}
        setCurrentFFT={() => {}}
        setMeta={() => {}}
        setSelectedAnnotation={() => {}}
      ></Actions>
    );

    const openButton = await screen.findByLabelText('Annotation 0 Modal Open');
    await userEvent.click(openButton);

    // Assert
    const textarea = await screen.findByLabelText('Annotation 0', { selector: 'textarea' });
    const annotation = JSON.parse(meta.annotations[0].getRaw());
    for (const key in annotation) {
      expect(textarea).toHaveTextContent(key);
      expect(textarea).toHaveTextContent(annotation[key]);
    }
  });

  test('Annotations modal is closes when clicking cross', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    const annotations = meta.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
    meta.annotations = annotations;

    render(
      <Actions
        meta={meta}
        index={0}
        fftSize={1024}
        startSampleCount={10}
        setCurrentFFT={() => {}}
        setMeta={() => {}}
        setSelectedAnnotation={() => {}}
      ></Actions>
    );

    // Act
    const openButton = await screen.findByLabelText('Annotation 0 Modal Open');
    await userEvent.click(openButton);

    const closeButton = await screen.findByLabelText('Close');
    await userEvent.click(closeButton);
    const modal = screen.queryByLabelText('Annotation 0', { selector: 'textarea' });

    //Assert
    expect(modal).not.toBeInTheDocument();
  });

  test('Annotations modal closes when updated', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    const annotations = meta.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
    meta.annotations = annotations;

    render(
      <Actions
        meta={meta}
        index={0}
        fftSize={1024}
        startSampleCount={10}
        setCurrentFFT={() => {}}
        setMeta={() => {}}
        setSelectedAnnotation={() => {}}
      ></Actions>
    );

    // Act
    const openButton = await screen.findByLabelText('Annotation 0 Modal Open');
    await userEvent.click(openButton);

    const updateButton = await screen.findByLabelText('Annotation 0 Modal Update');
    await userEvent.click(updateButton);
    const modal = screen.queryByLabelText('Annotation 0', { selector: 'textarea' });

    //Assert
    expect(modal).not.toBeInTheDocument();
  });

  test('Annotations modal does not close, displays errors and update is disabled when json not valid', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    const annotations = meta.annotations.map((annotation) => Object.assign(new Annotation(), annotation));
    meta.annotations = annotations;

    render(
      <Actions
        meta={meta}
        index={0}
        fftSize={1024}
        startSampleCount={10}
        setCurrentFFT={() => {}}
        setMeta={() => {}}
        setSelectedAnnotation={() => {}}
      ></Actions>
    );

    // Act
    const openButton = await screen.findByLabelText('Annotation 0 Modal Open');
    await userEvent.click(openButton);

    const textarea = await screen.findByLabelText('Annotation 0', { selector: 'textarea' });
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'not valid json');

    const updateButton = await screen.findByLabelText('Annotation 0 Modal Update');
    await userEvent.click(updateButton);

    // Assert
    const modal = await screen.queryByLabelText('Annotation 0', { selector: 'dialog' });
    expect(modal).toBeInTheDocument();
    expect(updateButton).toBeDisabled();
    expect(screen.getByText('Syntax Error: Unexpected token o in JSON at position 17')).toBeInTheDocument();
  });

  test('Annotations modal displays errors when schema not valid', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    const annotations = [Object.assign(new Annotation(), { ...meta.annotations[0] })];
    delete annotations[0]['core:sample_start'];
    delete annotations[0]['core:sample_count'];
    meta.annotations = annotations;

    render(
      <Actions
        meta={meta}
        index={0}
        fftSize={1024}
        startSampleCount={10}
        setCurrentFFT={() => {}}
        setMeta={() => {}}
        setSelectedAnnotation={() => {}}
      ></Actions>
    );

    // Act
    const openButton = await screen.findByLabelText('Annotation 0 Modal Open');
    await userEvent.click(openButton);

    const textarea = await screen.findByLabelText('Annotation 0', { selector: 'textarea' });
    await userEvent.clear(textarea);
    var json = JSON.stringify(annotations[0]);
    await userEvent.paste(json);

    const updateButton = await screen.findByLabelText('Annotation 0 Modal Update');
    await userEvent.click(updateButton);
    expect(updateButton).toBeDisabled();

    // Assert
    expect(
      screen.getByText("must have required property 'core:sample_start' inside /annotations/0")
    ).toBeInTheDocument();
    expect(
      screen.getByText("must have required property 'core:sample_count' inside /annotations/0")
    ).toBeInTheDocument();
  });
});
