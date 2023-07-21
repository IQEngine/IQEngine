import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent} from '@testing-library/react';

import React from 'react';

import FreqQuery from '@/pages/metadata-query/freq-query';

describe('Test FreqQuery', () => {
  const mockName = 'frequency name';
  const mockDescription = 'frequency description';

  test('Basic Rendering', () => {
    const validatorMock = vi.fn(() => 'this is valid');
    const handleQueryValidMock = vi.fn();
    const handleQueryInvalidMock = vi.fn();
    render(
      <FreqQuery
        queryName={mockName}
        description={mockDescription}
        validator={validatorMock}
        handleQueryValid={handleQueryValidMock}
        handleQueryInvalid={handleQueryInvalidMock}
      />
    );
    expect(screen.getByText('frequency name')).exist;
  });

  test('Changing the upper frequency bound calls the validator function and handleQueryValid function', () => {
    const validatorMock = vi.fn(() => 'this is valid');
    const handleQueryValidMock = vi.fn();
    const handleQueryInvalidMock = vi.fn();
    render(
      <FreqQuery
        queryName={mockName}
        description={mockDescription}
        validator={validatorMock}
        handleQueryValid={handleQueryValidMock}
        handleQueryInvalid={handleQueryInvalidMock}
      />
    );
    expect(validatorMock).toHaveBeenCalledWith({
      from: 30000000,
      to: 300000000,
    });
    const upperBound = screen.getByTestId('freq-upper');
    fireEvent.change(upperBound, { target: { value: '100000000' } });
    expect(validatorMock).toHaveBeenCalledWith({
      from: 30000000,
      to: '100000000',
    });
    expect(handleQueryValidMock).toHaveBeenCalledTimes(1);
  });

  test('Changing the upper frequency bound to lower than the lower bound calls the validator function and handleQueryInvalid function', () => {
    const validatorMock = vi.fn(() => false);
    const handleQueryValidMock = vi.fn();
    const handleQueryInvalidMock = vi.fn();
    render(
      <FreqQuery
        queryName={mockName}
        description={mockDescription}
        validator={validatorMock}
        handleQueryValid={handleQueryValidMock}
        handleQueryInvalid={handleQueryInvalidMock}
      />
    );
    expect(validatorMock).toHaveBeenCalledWith({
      from: 30000000,
      to: 300000000,
    });
    const upperBound = screen.getByTestId('freq-upper');
    fireEvent.change(upperBound, { target: { value: '1' } });
    expect(validatorMock).toHaveBeenCalledWith({
      from: 30000000,
      to: '1',
    });
    expect(handleQueryInvalidMock).toHaveBeenCalledTimes(1);
  })
});
