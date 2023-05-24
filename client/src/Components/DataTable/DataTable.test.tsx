import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DataColumn, DataRow, DataTable } from '@/Components/DataTable/DataTable';
import React from 'react';

// Arrange
const dataColumns: DataColumn[] = require('./data-table.test.data-columns.json');
const dataRows: DataRow[] = require('./data-table.test.data-rows.json');

describe('Data table component', () => {
  test('Display first 10 annotations on intitial view', async () => {
    // Act
    render(<DataTable dataColumns={dataColumns} dataRows={dataRows} />);

    const table = screen.getByRole('table');

    // Assert
    // Head plus ten elements
    expect(table.querySelectorAll('tr').length).toBe(11);

    for (const row of dataRows.slice(0, 10)) {
      await assertValues(row);
    }
  });

  test('Previous button disabled on intitial view', async () => {
    // Act
    render(<DataTable dataColumns={dataColumns} dataRows={dataRows} />);

    const previous = screen.getAllByRole('button').find((button) => button.textContent === 'Prev');

    // Assert
    expect(previous.hasAttribute('disabled')).toBeTruthy();
  });

  test('Display next 10 values when clicking next', async () => {
    // Act
    render(<DataTable dataColumns={dataColumns} dataRows={dataRows} />);

    const table = screen.getByRole('table');
    const next = screen.getAllByRole('button').find((button) => button.textContent === 'Next');

    await userEvent.click(next);

    // Assert
    // Head plus ten elements
    expect(next.hasAttribute('disabled')).toBeFalsy();
    expect(table.querySelectorAll('tr').length).toBe(11);

    for (const row of dataRows.slice(10, 20)) {
      await assertValues(row);
    }
  });

  test('Next button disabled when no more values on next page', async () => {
    // Arrange
    const dataColumns: DataColumn[] = require('./data-table.test.data-columns.json');
    const dataRows: DataRow[] = require('./data-table.test.data-rows.json').slice(0, 10);

    // Act
    render(<DataTable dataColumns={dataColumns} dataRows={dataRows.slice(0, 10)} />);

    const table = screen.getByRole('table');
    const next = screen.getAllByRole('button').find((button) => button.textContent === 'Next');

    // Assert
    expect(next.hasAttribute('disabled')).toBeTruthy();
  });

  test('Filter only returns associated values', async () => {
    // Act
    render(<DataTable dataColumns={dataColumns} dataRows={dataRows} />);

    const table = screen.getByRole('table');
    var text = 'Search ' + dataRows.length + ' records...';
    const filter = screen.getByPlaceholderText(text);

    await userEvent.type(filter, dataRows[0]['email']);

    // Assert
    // Head plus one element
    expect(table.querySelectorAll('tr').length).toBe(2);

    assertValues(dataRows[0]);
  });
});

test('Selecting 50 returns 50', async () => {
  // Act
  render(<DataTable dataColumns={dataColumns} dataRows={dataRows} />);

  const table = screen.getByRole('table');
  const select = screen.getByTestId('pagesize');

  await userEvent.selectOptions(select, '50');

  // Assert
  // Head plus 50 elements
  expect(table.querySelectorAll('tr').length).toBe(51);

  for (const row of dataRows.slice(0, 50)) {
    await assertValues(row);
  }
});

const assertValues = async (dataRow: DataRow) => {
  {
    for (const key in dataRow) {
      expect(await screen.getAllByText(dataRow[key])[0]).toBeInTheDocument();
    }
  }
};
