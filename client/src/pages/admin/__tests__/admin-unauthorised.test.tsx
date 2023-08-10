import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Admin from '@/pages/admin/admin';
import '@testing-library/jest-dom';
import React from 'react';
import { AllProviders } from '@/mocks/setup-tests';
import { MemoryRouter } from 'react-router-dom';

describe('Test Admin Unauthorised', () => {
  beforeEach(() => {
    vi.mock('@azure/msal-react', async () => {
      return {
        useMsal: () => {
          return {
            instance: {
              getActiveAccount: () => {
                return {
                  idTokenClaims: {
                    roles: ['IQEngine-User'],
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

  test('Does not show menu items', async () => {
    render(<Admin></Admin>, { wrapper: AllProviders });
    expect(screen.queryByText('Users Menu Item')).toBeNull();
    expect(screen.queryByText('Data Sources Menu Item')).toBeNull();
    expect(screen.queryByText('Plugins Menu Item')).toBeNull();
    expect(screen.queryByText('Configuration Menu Item')).toBeNull();
  });

  test('Shows unauthorised page', async () => {
    const route = '/admin';

    render(
      <MemoryRouter initialEntries={[route]}>
        <Admin></Admin>
      </MemoryRouter>
    );
    expect(await screen.findByText('You are unauthorized to view this page.')).toBeInTheDocument();
    expect(await screen.findByText('Please contact your administrator.')).toBeInTheDocument();
  });
});
