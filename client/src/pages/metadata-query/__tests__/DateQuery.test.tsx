import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent} from '@testing-library/react';

import React from 'react';

import DateQuery from '@/pages/metadata-query/DateQuery';

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

  test('Changing to and from to valid dates, calls handleQueryValid function', () => {
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

    fireEvent.change(dateFrom, { target: { value: '2023-01-01' } });
    fireEvent.change(dateTo, { target: { value: '2023-01-02' } });

    expect(handleQueryValidMock).toHaveBeenCalledTimes(2);
  });

  test('Changing to and from to invalid dates, calls handleQueryInValid function', () => {
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

    fireEvent.change(dateFrom, { target: { value: '2023-01-01' } });
    fireEvent.change(dateTo, { target: { value: '2022-01-02' } });

    expect(handleQueryInvalidMock).toHaveBeenCalledTimes(2);
  });
});
