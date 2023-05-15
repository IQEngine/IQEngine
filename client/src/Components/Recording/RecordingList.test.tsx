import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecordingList from './RecordingList';
import { RecordingObject, SampleRecordings } from './Recording';
import React from 'react';

describe('Recording list component', () => {
  test('renders recordings', async () => {
    render(<RecordingList recordings={SampleRecordings} />);

    for (const recording of SampleRecordings) {
      await assertValues(recording);
    }
  });
});

const assertValues = async (recording: RecordingObject) => {
  expect(await screen.getAllByText(recording.title)[0]).toBeInTheDocument();

  expect(await screen.getAllByText(recording.source)[0]).toBeInTheDocument();

  expect(await screen.getAllByText(recording.frequency)[0]).toBeInTheDocument();

  expect(await screen.getAllByAltText('Spectogram')[0]).toHaveAttribute('src', recording.spectogram);
};
