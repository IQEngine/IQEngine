import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import React from 'react';

import { SourceQuery } from '@/pages/browser/metadata-query/data-source-query';
import userEvent from '@testing-library/user-event';
import { AllProviders } from '@/mocks/setup-tests';
import '@testing-library/jest-dom';

describe('Test SourceQuery', () => {
  const mockName = 'datasource name';
  test('Basic Rendering', () => {
    const validatorMock = vi.fn(() => 'this is valid');
    const handleQueryValidMock = vi.fn();
    const handleQueryInvalidMock = vi.fn();
    render(
      <SourceQuery
        queryName={mockName}
        validator={validatorMock}
        handleQueryValid={handleQueryValidMock}
        handleQueryInvalid={handleQueryInvalidMock}
      />,
      { wrapper: AllProviders }
    );
    expect(screen.getByText('Select All')).exist;
  });

  test('Toggle "Select All" checkbox should select/deselect all other checkboxes', () => {
    const validatorMock = vi.fn(() => 'this is valid');
    const handleQueryValidMock = vi.fn();
    const handleQueryInvalidMock = vi.fn();
    render(
      <SourceQuery
        queryName={mockName}
        validator={validatorMock}
        handleQueryValid={handleQueryValidMock}
        handleQueryInvalid={handleQueryInvalidMock}
      />,
      { wrapper: AllProviders }
    );
    const selectAllCheckbox = screen.getByTestId('checkbox-selectall');

    userEvent.click(selectAllCheckbox);
    const checkboxes = screen.getAllByTestId(/checkbox-.*/);
    checkboxes.forEach((checkbox) => {
      if (checkbox !== selectAllCheckbox) {
        expect(checkbox).toBeChecked();
      }
    });

    userEvent.click(selectAllCheckbox);
    checkboxes.forEach((checkbox) => {
      if (checkbox !== selectAllCheckbox) {
        expect(checkbox).not.toBeChecked();
      }
    });
  });
});
