import { describe, expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';
import { AllProviders } from '@/mocks/setup-tests';
import DataSourceForm from '@/pages/admin/pages/add-data-source';
import nock from 'nock';

describe('Test DataSources', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  test('Basic Rendering', async () => {
    render(<DataSourceForm></DataSourceForm>, { wrapper: AllProviders });
    expect(screen.getByPlaceholderText('Data Source Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Storage Account name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Container Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Image URL (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('SAS Token (optional)')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  test('should call the API when the button is clicked', async () => {
    const mockResponse = { data: { message: 'Mocked response from API' } };
    nock('http://localhost:3000').post('/api/datasources').reply(200, mockResponse.data);

    render(<DataSourceForm />, { wrapper: AllProviders });

    const submit = screen.getByRole('button', { name: 'Submit Data Source Button' });
    fireEvent.click(submit);

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(nock.isDone()).toBe(true);
  });

  test('Displays add data source successful when successful', async () => {
    nock('http://localhost:3000').post('/api/datasources').reply(201);
    render(<DataSourceForm />, { wrapper: AllProviders });
    const submit = screen.getByRole('button', { name: 'Submit Data Source Button' });
    await userEvent.click(submit);
    expect(await screen.findByText('Successfully added data source')).toBeInTheDocument();
  });

  test('Displays You have already added this data source when there is a conflict', async () => {
    nock('http://localhost:3000').post('/api/datasources').reply(409);
    render(<DataSourceForm />, { wrapper: AllProviders });
    const submit = screen.getByRole('button', { name: 'Submit Data Source Button' });
    await userEvent.click(submit);
    expect(await screen.findByText('You have already added this data source')).toBeInTheDocument();
  });

  test('Displays error when unsuccessful', async () => {
    nock('http://localhost:3000').post('/api/datasources').reply(500);
    render(<DataSourceForm />, { wrapper: AllProviders });
    const submit = screen.getByRole('button', { name: 'Submit Data Source Button' });
    await userEvent.click(submit);
    expect(await screen.findByText('Something went wrong adding the data source')).toBeInTheDocument();
  });
});
