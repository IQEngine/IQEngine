import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import StringQuery from '@/pages/browser/metadata-query/string-query';

describe('Test StringQuery', () => {
  test('Basic Rendering', () => {
    render(
      <StringQuery
        queryName="test query"
        description="test description"
        validator={vi.fn()}
        handleQueryValid={vi.fn()}
        handleQueryInvalid={vi.fn()}
      />
    );
    expect(screen.getByText('test query')).exist;
  });

  test('Typing text into the input calls the validator function and handleQueryValid', async () => {
    const validatorMock = vi.fn(() => 'this is valid');
    const handleQueryValidMock = vi.fn();

    render(
      <StringQuery
        queryName="test query"
        description="test description"
        validator={validatorMock}
        handleQueryValid={handleQueryValidMock}
        handleQueryInvalid={vi.fn()}
      />
    );
    const inputElement = screen.getByTestId('string-input');
    await userEvent.type(inputElement, 'testing');
    expect(validatorMock).toHaveBeenCalledWith('testing');
    // it should have been called one time for each character typed
    expect(handleQueryValidMock).toHaveBeenCalledTimes(7);
  });

  test('Typing invalid text into the input calls the validator function and handleQueryInValid', async () => {
    const validatorMock = vi.fn(() => false);
    const handleQueryInvalidMock = vi.fn();

    render(
      <StringQuery
        queryName="test query"
        description="test description"
        validator={validatorMock}
        handleQueryValid={vi.fn()}
        handleQueryInvalid={handleQueryInvalidMock}
      />
    );
    const inputElement = screen.getByTestId('string-input');
    await userEvent.type(inputElement, 'testing');
    expect(validatorMock).toHaveBeenCalledWith('testing');
    // it should have been called one time for each character typed
    expect(handleQueryInvalidMock).toHaveBeenCalledTimes(7);
  });
});
