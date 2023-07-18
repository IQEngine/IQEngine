import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Configuration from '@/pages/admin/pages/configuration';
import '@testing-library/jest-dom';
import React from 'react';
import { AllProviders, queryClient } from '@/mocks/setup-tests';
import nock from 'nock';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'react-hot-toast';

describe('Test Configuration', () => {
  beforeEach(() => {
    nock.cleanAll();
    queryClient.clear();
  });

  test('Basic Rendering', async () => {
    render(<Configuration></Configuration>, { wrapper: AllProviders });
    expect(await screen.findByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
  });

  test('Feature Flags', async () => {
    render(<Configuration></Configuration>, { wrapper: AllProviders });
    expect(await screen.findByRole('heading', { name: 'Feature Flags' })).toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: 'useIQEngineOutReach' })).toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: 'displayIQEngineGitHub' })).toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: 'displayInternalBranding' })).toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: 'useAPIDatasources' })).toBeInTheDocument();

    expect(await screen.findByText('Use IQEngine Outreach')).toBeInTheDocument();
    expect(await screen.findByText('Display IQEngine GitHub')).toBeInTheDocument();
    expect(await screen.findByText('Display Internal Branding')).toBeInTheDocument();
    expect(await screen.findByText('Use API Datasources')).toBeInTheDocument();
  });

  test('Feature Flags Default', async () => {
    nock('http://localhost:3000').get('/api/config').reply(404, {});
    render(<Configuration></Configuration>, { wrapper: AllProviders });
    expect(await screen.findByRole('checkbox', { name: 'useIQEngineOutReach' })).toBeChecked();
    expect(await screen.findByRole('checkbox', { name: 'displayIQEngineGitHub' })).toBeChecked();
    expect(await screen.findByRole('checkbox', { name: 'displayInternalBranding' })).not.toBeChecked();
    expect(await screen.findByRole('checkbox', { name: 'useAPIDatasources' })).toBeChecked();
  });

  test('Feature Flags Displays Returned Values', async () => {
    nock('http://localhost:3000')
      .get('/api/config')
      .reply(200, {
        featureFlags: {
          useIQEngineOutReach: true,
          displayIQEngineGitHub: true,
          displayInternalBranding: true,
          useAPIDatasources: true,
        },
      });
    render(<Configuration></Configuration>, { wrapper: AllProviders });

    expect(await screen.findByRole('checkbox', { name: 'useIQEngineOutReach', checked: true })).toBeChecked();
    expect(await screen.findByRole('checkbox', { name: 'displayIQEngineGitHub', checked: true })).toBeChecked();
    expect(await screen.findByRole('checkbox', { name: 'displayInternalBranding', checked: true })).toBeChecked();
    expect(await screen.findByRole('checkbox', { name: 'useAPIDatasources', checked: true })).toBeChecked();
  });

  test('Feature Flags Displays Returned Values', async () => {
    nock('http://localhost:3000')
      .get('/api/config')
      .reply(200, {
        featureFlags: {
          useIQEngineOutReach: true,
          displayInternalBranding: true,
          useAPIDatasources: true,
          invalidFlag: true,
        },
      });
    render(<Configuration></Configuration>, { wrapper: AllProviders });

    expect(await screen.findByRole('checkbox', { name: 'useIQEngineOutReach', checked: true })).toBeChecked();
    expect(await screen.findByRole('checkbox', { name: 'displayIQEngineGitHub', checked: true })).toBeChecked();
    expect(await screen.findByRole('checkbox', { name: 'displayInternalBranding', checked: true })).toBeChecked();
    expect(await screen.findByRole('checkbox', { name: 'useAPIDatasources', checked: true })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: 'invalidFlag' })).not.toBeInTheDocument();
  });

  test('Feature Flags Updates', async () => {
    nock('http://localhost:3000')
      .get('/api/config')
      .reply(200, {
        featureFlags: {
          useIQEngineOutReach: true,
          displayIQEngineGitHub: true,
          displayInternalBranding: true,
          useAPIDatasources: true,
        },
      });
    render(<Configuration></Configuration>, { wrapper: AllProviders });

    const useIQEngineOutReach = await screen.findByRole('checkbox', { name: 'useIQEngineOutReach', checked: true });
    await userEvent.click(useIQEngineOutReach);
    expect(useIQEngineOutReach).not.toBeChecked();

    const displayIQEngineGitHub = await screen.findByRole('checkbox', { name: 'displayIQEngineGitHub', checked: true });
    await userEvent.click(displayIQEngineGitHub);

    expect(displayIQEngineGitHub).not.toBeChecked();

    const displayInternalBranding = await screen.findByRole('checkbox', {
      name: 'displayInternalBranding',
      checked: true,
    });
    await userEvent.click(displayInternalBranding);
    expect(displayInternalBranding).not.toBeChecked();

    const useAPIDatasources = await screen.findByRole('checkbox', { name: 'useAPIDatasources', checked: true });
    await userEvent.click(useAPIDatasources);
    expect(useAPIDatasources).not.toBeChecked();
  });

  test('Save Button Disabled When No Changes', async () => {
    nock('http://localhost:3000')
      .get('/api/config')
      .reply(200, {
        featureFlags: {
          useIQEngineOutReach: true,
          displayIQEngineGitHub: true,
          displayInternalBranding: true,
          useAPIDatasources: true,
        },
      });
    render(<Configuration></Configuration>, { wrapper: AllProviders });

    const saveButton = screen.getByRole('button', { name: 'Save Configuration Button' });
    expect(saveButton).toBeDisabled();
  });

  test('Displays save successful message when successful update', async () => {
    nock('http://localhost:3000')
      .get('/api/config')
      .reply(200, {
        featureFlags: {
          useIQEngineOutReach: true,
          displayIQEngineGitHub: true,
          displayInternalBranding: true,
          useAPIDatasources: true,
        },
      });

    nock('http://localhost:3000').put(`/api/config`).reply(200);

    render(
      <>
        <Toaster />
        <Configuration />
      </>,
      { wrapper: AllProviders }
    );

    const displayInternalBranding = await screen.findByRole('checkbox', {
      name: 'displayInternalBranding',
      checked: true,
    });
    await userEvent.click(displayInternalBranding);
    expect(displayInternalBranding).not.toBeChecked();

    const saveButton = screen.getByRole('button', { name: 'Save Configuration Button' });
    await userEvent.click(saveButton);

    expect(await screen.findByText('Successfully updated configuration')).toBeInTheDocument();
  });

  test('Displays save unsuccessful message when error on update', async () => {
    nock('http://localhost:3000')
      .get('/api/config')
      .reply(200, {
        featureFlags: {
          useIQEngineOutReach: true,
          displayIQEngineGitHub: true,
          displayInternalBranding: true,
          useAPIDatasources: true,
        },
      });

    nock('http://localhost:3000').put(`/api/config`).reply(404);

    render(
      <>
        <Toaster />
        <Configuration />
      </>,
      { wrapper: AllProviders }
    );

    const displayInternalBranding = await screen.findByRole('checkbox', {
      name: 'displayInternalBranding',
      checked: true,
    });
    await userEvent.click(displayInternalBranding);
    expect(displayInternalBranding).not.toBeChecked();

    const saveButton = screen.getByRole('button', { name: 'Save Configuration Button' });
    await userEvent.click(saveButton);

    expect(await screen.findByText('Something went wrong updating configuration')).toBeInTheDocument();
  });
});
