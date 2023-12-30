import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import DateQuery from '@/pages/browser/metadata-query/date-query';
import userEvent from '@testing-library/user-event';

describe('Test DateQuery', () => {
  const mockName = 'date name';
  const mockDescription = 'date description';

  test('Basic Rendering', () => {
    const validatorMock = vi.fn(() => 'this is valid');
    const handleQueryValidMock = vi.fn();
    const handleQueryInvalidMock = vi.fn();
    render(
      <DateQuery
        queryName={mockName}
        description={mockDescription}
        validator={validatorMock}
        handleQueryValid={handleQueryValidMock}
        handleQueryInvalid={handleQueryInvalidMock}
      />
    );
    expect(screen.getByText('date name')).exist;
  });

  test('Changing to and from to valid dates, calls handleQueryValid function', async () => {
    const validatorMock = vi.fn(() => 'this is valid');
    const handleQueryValidMock = vi.fn();
    const handleQueryInvalidMock = vi.fn();
    render(
      <DateQuery
        queryName={mockName}
        description={mockDescription}
        validator={validatorMock}
        handleQueryValid={handleQueryValidMock}
        handleQueryInvalid={handleQueryInvalidMock}
      />
    );
    const dateFrom = screen.getByTestId('date-from');
    const dateTo = screen.getByTestId('date-to');

    await userEvent.type(dateFrom, '2023-01-01');
    await userEvent.type(dateTo, '2023-01-02');

    expect(handleQueryValidMock).toHaveBeenCalledWith(mockName, 'this is valid');
  });

  test('Changing to and from to invalid dates, calls handleQueryInValid function', async () => {
    const validatorMock = vi.fn(() => false);
    const handleQueryValidMock = vi.fn();
    const handleQueryInvalidMock = vi.fn();
    render(
      <DateQuery
        queryName={mockName}
        description={mockDescription}
        validator={validatorMock}
        handleQueryValid={handleQueryValidMock}
        handleQueryInvalid={handleQueryInvalidMock}
      />
    );
    const dateFrom = screen.getByTestId('date-from');
    const dateTo = screen.getByTestId('date-to');

    await userEvent.type(dateFrom, '2023-01-01');
    await userEvent.type(dateTo, '2022-01-02');

    expect(handleQueryInvalidMock).toHaveBeenCalledWith(mockName);
    expect(handleQueryValidMock).not.toHaveBeenCalled();
  });
});
