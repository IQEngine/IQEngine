import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AutoSizeInput } from '@/features/ui/auto-size-input/AutoSizeInput';
import React from 'react';

describe('Auto size input component', () => {
  test('Should display initial input', async () => {
    // Arrange & Act
    render(<AutoSizeInput value="Test initial input" />);

    // Assert
    expect(await screen.findByText('Test initial input')).toBeInTheDocument();
  });

  test('Should update input', async () => {
    // Arrange
    render(<AutoSizeInput value="Test initial input" />);
    const autoSizeInput = await screen.findByRole('textbox');

    // Act
    await userEvent.clear(autoSizeInput);
    await userEvent.type(autoSizeInput, 'This is the new text');

    // Assert
    expect(await screen.queryByText('Test initial input')).not.toBeInTheDocument();
    expect(await screen.findByText('This is the new text')).toBeInTheDocument();
  });

  test('Span should not be visible', async () => {
    // Arrange
    render(<AutoSizeInput value="Test initial input" />);

    // Act
    const span = screen.getByText((content, element) => {
      return element.tagName.toLowerCase() === 'span' && content.startsWith('Test initial input');
    });

    // Assert
    expect(span).toHaveClass('hide');
  });

  test('Error should not be visible', async () => {
    // Arrange
    render(<AutoSizeInput value="Test initial input" />);

    // Act
    const error = await screen.queryByTitle('This is an error');

    // Assert
    expect(error).toBeNull();
  });

  test('Error with parent error should be visible', async () => {
    // Arrange
    const parent = { error: 'This is an error' };
    render(<AutoSizeInput value="Test initial input" parent={parent} />);

    // Act
    const error = await screen.queryByTitle('This is an error');

    // Assert
    expect(error).toBeInTheDocument();
  });
});
