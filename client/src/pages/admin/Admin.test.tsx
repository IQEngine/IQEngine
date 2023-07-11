import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Admin from '@/pages/admin/Admin';
import '@testing-library/jest-dom';
import React from 'react';
import userEvent from '@testing-library/user-event';

describe('Test Admin', () => {
  test('Basic Rendering', async () => {
    render(<Admin></Admin>);
    expect(await screen.findByLabelText('Users Menu Item')).toHaveTextContent('Users');
    expect(await screen.findByLabelText('Data Sources Menu Item')).toHaveTextContent('Data Sources');
    expect(await screen.findByLabelText('Plugins Menu Item')).toHaveTextContent('Plugins');
    expect(await screen.findByLabelText('Configuration Menu Item')).toHaveTextContent('Configuration');
  });

  test('Display Users', async () => {
    render(<Admin />);
    const userMenuItem = await screen.findByLabelText('Users Menu Item');
    userEvent.click(userMenuItem);

    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
  });

  test('Display Data Sources', async () => {
    render(<Admin />);
    const dataSourcesMenuItem = await screen.findByLabelText('Data Sources Menu Item');
    userEvent.click(dataSourcesMenuItem);

    expect(await screen.findByRole('heading', { name: 'Data Sources' })).toBeInTheDocument();
  });

  test('Display Plugins', async () => {
    render(<Admin />);
    const pluginsMenuItem = await screen.findByLabelText('Plugins Menu Item');
    userEvent.click(pluginsMenuItem);

    expect(await screen.findByRole('heading', { name: 'Plugins' })).toBeInTheDocument();
  });

  test('Display Configuration', async () => {
    render(<Admin />);
    const configurationMenuItem = await screen.findByLabelText('Configuration Menu Item');
    userEvent.click(configurationMenuItem);

    expect(await screen.findByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
  });
});
