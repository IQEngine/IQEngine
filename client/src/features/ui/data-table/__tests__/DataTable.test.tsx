import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DataColumn, DataRow, DataTable } from '@/features/ui/data-table/DataTable';
import React from 'react';

// Arrange
const dataColumns: DataColumn[] = require('./DataTable.test.columns.json');
const dataRows: DataRow[] = require('./DataTable.test.rows.json');

describe('Data table component', () => {
  test('Display first 10 annotations on initial view', async () => {
    // Act
    render(<DataTable dataColumns={dataColumns} dataRows={dataRows} />);

    const table = await screen.findByRole('table', { name: /data table/i });

    // Assert
    // Head plus ten elements
    expect(table.querySelectorAll('tr').length).toBe(11);

    for (const row of dataRows.slice(0, 10)) {
      for (const key in row) {
        expect(screen.getAllByText(row[key])[0]).toBeInTheDocument();
      }
    }
  });

  test('Previous and next button disabled when empty list', async () => {
    // Arrange
    const dataColumns: DataColumn[] = [];
    const dataRows: DataRow[] = [];

    // Act
    render(<DataTable dataColumns={dataColumns} dataRows={dataRows.slice(0, 10)} />);

    const previous = await screen.findByRole('button', { name: /previous page/i });
    const next = await screen.findByRole('button', { name: /next page/i });

    // Assert
    expect(previous.hasAttribute('disabled')).toBeTruthy();
    expect(next.hasAttribute('disabled')).toBeTruthy();
  });

  test('Previous button disabled on initial view', async () => {
    // Act
    render(<DataTable dataColumns={dataColumns} dataRows={dataRows} />);

    const previous = await screen.findByRole('button', { name: /previous page/i });

    // Assert
    expect(previous.hasAttribute('disabled')).toBeTruthy();
  });

  test('Display next 10 values when clicking next', async () => {
    // Act
    render(<DataTable dataColumns={dataColumns} dataRows={dataRows} />);

    const table = await screen.findByRole('table', { name: /data table/i });
    const next = await screen.findByRole('button', { name: /next page/i });

    await userEvent.click(next);

    // Assert
    // Head plus ten elements
    expect(next.hasAttribute('disabled')).toBeFalsy();
    expect(table.querySelectorAll('tr').length).toBe(11);

    for (const row of dataRows.slice(10, 20)) {
      for (const key in row) {
        expect(screen.getAllByText(row[key])[0]).toBeInTheDocument();
      }
    }
  });

  test('Next button disabled when no more values on next page', async () => {
    // Arrange
    const dataColumns: DataColumn[] = require('./DataTable.test.columns.json');
    const dataRows: DataRow[] = require('./DataTable.test.rows.json').slice(0, 10);

    // Act
    render(<DataTable dataColumns={dataColumns} dataRows={dataRows.slice(0, 10)} />);

    const table = await screen.findByRole('table', { name: /data table/i });
    const next = await screen.findByRole('button', { name: /next page/i });

    // Assert
    expect(next.hasAttribute('disabled')).toBeTruthy();
  });

  test('Filter only returns associated values', async () => {
    // Act
    render(<DataTable dataColumns={dataColumns} dataRows={dataRows} />);

    const table = await screen.findByRole('table');
    var text = 'Search ' + dataRows.length + ' records...';
    const filter = await screen.findByPlaceholderText(text);

    await userEvent.type(filter, dataRows[0]['email']);

    // Assert
    // Head plus one element
    expect(table.querySelectorAll('tr').length).toBe(2);

    for (const key in dataRows[0]) {
      expect(screen.getAllByText(dataRows[0][key])[0]).toBeInTheDocument();
    }
  });
});

test('Selecting 50 returns 50', async () => {
  // Act
  render(<DataTable dataColumns={dataColumns} dataRows={dataRows} />);

  const table = await screen.findByRole('table', { name: /data table/i });
  const select = await screen.findByRole('combobox', { name: /page size/i });

  await userEvent.selectOptions(select, '50');

  // Assert
  // Head plus 50 elements
  expect(table.querySelectorAll('tr').length).toBe(51);

  for (const row of dataRows.slice(0, 50)) {
    for (const key in row) {
      expect(screen.getAllByText(row[key])[0]).toBeInTheDocument();
    }
  }
});
