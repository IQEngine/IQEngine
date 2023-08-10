import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Admin from '@/pages/admin/admin';
import '@testing-library/jest-dom';
import React from 'react';
import { AllProviders } from '@/mocks/setup-tests';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

describe('Test Admin', () => {
  test('Basic Rendering', async () => {
    render(<Admin></Admin>, { wrapper: AllProviders });
    expect(await screen.findByLabelText('Users Menu Item')).toHaveTextContent('Users');
    expect(await screen.findByLabelText('Data Sources Menu Item')).toHaveTextContent('Data Sources');
    expect(await screen.findByLabelText('Plugins Menu Item')).toHaveTextContent('Plugins');
    expect(await screen.findByLabelText('Configuration Menu Item')).toHaveTextContent('Configuration');
  });

  beforeEach(() => {
    vi.mock('@azure/msal-react', async () => {
      return {
        useMsal: () => {
          return {
            instance: {
              getActiveAccount: () => {
                return {
                  idTokenClaims: {
                    roles: ['IQEngine-Admin'],
                  },
                };
              },
            },
          };
        },
      };
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('Users Menu Item Active', async () => {
    const route = '/admin/users';

    render(
      <MemoryRouter initialEntries={[route]}>
        <Admin></Admin>
      </MemoryRouter>
    );
    const userLink = (await screen.findByLabelText('Users Menu Item')).querySelector('a');
    expect(userLink).toHaveClass('active');
  });

  test('Data Sources Menu Item Active', async () => {
    const route = '/admin/data-sources';

    render(
      <MemoryRouter initialEntries={[route]}>
        <Admin></Admin>
      </MemoryRouter>
    );
    const dataSourceLink = (await screen.findByLabelText('Data Sources Menu Item')).querySelector('a');
    expect(dataSourceLink).toHaveClass('active');
  });

  test('Plugins Menu Item Active', async () => {
    const route = '/admin/plugins';

    render(
      <MemoryRouter initialEntries={[route]}>
        <Admin></Admin>
      </MemoryRouter>
    );
    const pluginsLink = (await screen.findByLabelText('Plugins Menu Item')).querySelector('a');
    expect(pluginsLink).toHaveClass('active');
  });

  test('Configuration Menu Item Active', async () => {
    const route = '/admin/configuration';

    render(
      <MemoryRouter initialEntries={[route]}>
        <Admin></Admin>
      </MemoryRouter>
    );
    const configurationLink = (await screen.findByLabelText('Configuration Menu Item')).querySelector('a');
    expect(configurationLink).toHaveClass('active');
  });

  test('Default Menu Item', async () => {
    const route = '/admin';

    render(
      <MemoryRouter initialEntries={[route]}>
        <Admin></Admin>
      </MemoryRouter>
    );
    const userLink = (await screen.findByLabelText('Users Menu Item')).querySelector('a');
    expect(userLink).toHaveClass('active');
  });

  test('Users Menu Item Click', async () => {
    const route = '/admin';

    render(
      <MemoryRouter initialEntries={[route]}>
        <Admin></Admin>
      </MemoryRouter>
    );
    const userLink = (await screen.findByLabelText('Users Menu Item')).querySelector('a');
    await userEvent.click(userLink);
    expect(userLink).toHaveClass('active');
  });

  test('Data Sources Menu Item Click', async () => {
    const route = '/admin';

    render(
      <MemoryRouter initialEntries={[route]}>
        <Admin></Admin>
      </MemoryRouter>
    );
    const dataSourceLink = (await screen.findByLabelText('Data Sources Menu Item')).querySelector('a');
    await userEvent.click(dataSourceLink);
    expect(dataSourceLink).toHaveClass('active');
  });

  test('Plugins Menu Item Click', async () => {
    const route = '/admin';

    render(
      <MemoryRouter initialEntries={[route]}>
        <Admin></Admin>
      </MemoryRouter>
    );
    const pluginsLink = (await screen.findByLabelText('Plugins Menu Item')).querySelector('a');
    await userEvent.click(pluginsLink);
    expect(pluginsLink).toHaveClass('active');
  });

  test('Configuration Menu Item Click', async () => {
    const route = '/admin';

    render(
      <MemoryRouter initialEntries={[route]}>
        <Admin></Admin>
      </MemoryRouter>
    );
    const configurationLink = (await screen.findByLabelText('Configuration Menu Item')).querySelector('a');
    await userEvent.click(configurationLink);
    expect(configurationLink).toHaveClass('active');
  });
});
