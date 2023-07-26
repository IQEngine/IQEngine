import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Plugins, { PluginAdd, PluginEdit } from '@/pages/admin/pages/plugins';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useAllProviders } from '@/mocks/setup-tests';
import nock from 'nock';
import { PluginDefinition } from '@/api/Models';

describe('Test Plugins Get', () => {
  beforeEach(() => {
    nock.cleanAll();
    const { queryClient } = useAllProviders();
    queryClient.clear();
  });
  test('Basic Rendering', async () => {
    nock('http://localhost:3000')
      .get('/api/plugins/')
      .reply(200, [
        {
          name: 'Test Plugin',
          url: 'http://my.plugin.com/hello/plugins/',
        },
      ]);

    nock('http://my.plugin.com')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/hello/plugins/')
      .reply(200, []);

    const { wrapper } = useAllProviders();
    render(<Plugins></Plugins>, {
      wrapper: wrapper,
    });
    expect(await screen.findByRole('heading', { name: 'Plugins' })).toBeInTheDocument();
    expect(await screen.findByText('Test Plugin', { exact: true, selector: 'td' })).toBeInTheDocument();
    expect(
      await screen.findByText('http://my.plugin.com/hello/plugins/', { exact: true, selector: 'td' })
    ).toBeInTheDocument();
  });
  test('Basic Rendering with no plugins', async () => {
    nock('http://localhost:3000').get('/api/plugins/').reply(200, []);

    const { wrapper } = useAllProviders();
    render(<Plugins></Plugins>, {
      wrapper: wrapper,
    });
    expect(await screen.findByRole('heading', { name: 'Plugins' })).toBeInTheDocument();
    expect(await screen.findByText('No plugins found')).toBeInTheDocument();
  });

  test('Basic Rendering with plugin details', async () => {
    nock('http://localhost:3000')
      .get('/api/plugins/')
      .reply(200, [
        {
          name: 'Test Plugin',
          url: 'http://my.plugin.com/hello/plugins/',
        },
      ]);
    nock('http://my.plugin.com')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/hello/plugins/')
      .reply(200, ['first', 'second']);
    nock('http://my.plugin.com')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/hello/plugins/first/')
      .reply(200, {
        first_param1: {
          type: 'string',
          title: 'Param1',
          default: 'default',
        },
        first_param2: {
          type: 'number',
          title: 'Param2',
          default: 42,
        },
      });
    nock('http://my.plugin.com')
      .defaultReplyHeaders({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })
      .get('/hello/plugins/second/')
      .reply(200, {
        second_param1: {
          type: 'string',
          title: 'Param1',
          default: 'default',
        },
        second_param2: {
          type: 'number',
          title: 'Param2',
          default: 42,
        },
      });
    const { wrapper } = useAllProviders();
    render(<Plugins></Plugins>, {
      wrapper: wrapper,
    });
    expect(await screen.findByRole('heading', { name: 'Plugins' })).toBeInTheDocument();
    expect(await screen.findByText('Test Plugin', { exact: true, selector: 'td' })).toBeInTheDocument();
    expect(
      await screen.findByText('http://my.plugin.com/hello/plugins/', { exact: true, selector: 'td' })
    ).toBeInTheDocument();
  });
});

describe('Test Plugins Post', () => {
  beforeEach(() => {
    nock.cleanAll();
    const { queryClient } = useAllProviders();
    queryClient.clear();
  });
  test('Should try to save a new plugin correctly and display the result in the screen', async () => {
    nock('http://localhost:3000').get('/api/plugins/').reply(200, []);
    nock('http://localhost:3000')
      .post('/api/plugins/', {
        name: 'Test Plugin',
        url: 'http://my.plugin.com/hello/plugins/',
      })
      .reply(200, {
        name: 'Test Plugin',
        url: 'http://my.plugin.com/hello/plugins/',
      });
    const { wrapper } = useAllProviders();
    render(<PluginAdd></PluginAdd>, {
      wrapper: wrapper,
    });
    await userEvent.type(await screen.findByLabelText('add plugin name'), 'Test Plugin');
    await userEvent.type(await screen.findByLabelText('add plugin url'), 'http://my.plugin.com/hello/plugins/');
    await userEvent.click(await screen.findByRole('button', { name: 'create plugin' }));

    expect(await screen.findByText('Successfully added plugin')).toBeInTheDocument();
  });

  test('Should try to save a new plugin fail and display the result in the screen', async () => {
    nock('http://localhost:3000').get('/api/plugins/').reply(200, []);
    nock('http://localhost:3000')
      .post('/api/plugins/', {
        name: 'Test Plugin',
        url: 'http://my.plugin.com/hello/plugins/',
      })
      .reply(500, '');
    const { wrapper } = useAllProviders();
    render(<PluginAdd></PluginAdd>, {
      wrapper: wrapper,
    });
    await userEvent.type(await screen.findByLabelText('add plugin name'), 'Test Plugin');
    await userEvent.type(await screen.findByLabelText('add plugin url'), 'http://my.plugin.com/hello/plugins/');
    await userEvent.click(await screen.findByRole('button', { name: 'create plugin' }));
    expect(await screen.findByText('Something went wrong adding a plugin')).toBeInTheDocument();
  });
});

describe('Test Plugins Delete', () => {
  beforeEach(() => {
    nock.cleanAll();
    const { queryClient } = useAllProviders();
    queryClient.clear();
  });
  test('Should try to delete a plugin correctly and display the result in the screen', async () => {
    const currrent_confirm = window.confirm;
    window.confirm = vi.fn(() => true);
    nock('http://localhost:3000')
      .get('/api/plugins/')
      .reply(200, [
        {
          name: 'TestPlugin',
          url: 'http://my.plugin.com/hello/plugins/',
        },
      ]);
    nock('http://localhost:3000').delete('/api/plugins/TestPlugin').reply(200, {
      name: 'TestPlugin',
      url: 'http://my.plugin.com/hello/plugins/',
    });
    const { wrapper } = useAllProviders();
    render(<Plugins></Plugins>, {
      wrapper: wrapper,
    });
    expect(await screen.findByRole('heading', { name: 'Plugins' })).toBeInTheDocument();
    expect(await screen.findByText('TestPlugin', { selector: 'td' })).toBeInTheDocument();
    expect(await screen.findByText('http://my.plugin.com/hello/plugins/', { selector: 'td' })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'delete TestPlugin plugin' }));

    expect(await screen.findByText('Successfully deleted plugin')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('TestPlugin', { selector: 'td' })).not.toBeInTheDocument();
    });

    window.confirm = currrent_confirm;
  });

  test('Should try to delete a plugin fail and display the result in the screen', async () => {
    const currrent_confirm = window.confirm;
    window.confirm = vi.fn(() => true);
    nock('http://localhost:3000')
      .get('/api/plugins/')
      .reply(200, [
        {
          name: 'TestPlugin',
          url: 'http://my.plugin.com/hello/plugins/',
        },
      ]);

    nock('http://localhost:3000').delete('/api/plugins/TestPlugin').reply(500, '');

    const { wrapper } = useAllProviders();
    render(<Plugins></Plugins>, {
      wrapper: wrapper,
    });
    expect(await screen.findByRole('heading', { name: 'Plugins' })).toBeInTheDocument();
    expect(await screen.findByText('TestPlugin', { selector: 'td' })).toBeInTheDocument();
    expect(await screen.findByText('http://my.plugin.com/hello/plugins/', { selector: 'td' })).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'delete TestPlugin plugin' }));
    expect(await screen.findByText('Something went wrong deleting the plugin')).toBeInTheDocument();
    expect(await screen.findByText('TestPlugin', { selector: 'td' })).toBeInTheDocument();
    expect(await screen.findByText('http://my.plugin.com/hello/plugins/', { selector: 'td' })).toBeInTheDocument();
    window.confirm = currrent_confirm;
  });
});

describe('Test Plugins Edit', () => {
  beforeEach(() => {
    nock.cleanAll();
    const { queryClient } = useAllProviders();
    queryClient.clear();
  });
  test('Should try to edit a plugin correctly and display the result in the screen', async () => {
    const user = userEvent.setup();
    nock('http://localhost:3000')
      .get('/api/plugins/')
      .reply(200, [
        {
          name: 'TestPlugin',
          url: 'http://my.plugin.com/hello/plugins/',
        },
      ]);
    nock('http://localhost:3000')
      .put('/api/plugins/TestPlugin', {
        name: 'TestPlugin',
        url: 'http://my.plugin.com/new/plugins/',
      })
      .reply(200, {
        name: 'TestPlugin',
        url: 'http://my.plugin.com/new/plugins/',
      });
    const testPlugin: PluginDefinition = {
      name: 'TestPlugin',
      url: 'http://my.plugin.com/new/plugins/'
    }

    const { wrapper } = useAllProviders();
    render(<PluginEdit plugin={testPlugin}></PluginEdit>, {
      wrapper: wrapper,
    });
    await user.clear(await screen.findByLabelText('edit TestPlugin plugin url'));
    await user.type(await screen.findByLabelText('edit TestPlugin plugin url'), 'http://my.plugin.com/new/plugins/');
    expect(await screen.findByDisplayValue('http://my.plugin.com/new/plugins/')).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'save TestPlugin plugin' }));
    expect(await screen.findByText('Successfully updated plugin')).toBeInTheDocument();
  });

  test('Should try to edit a plugin fail and display the result in the screen', async () => {
    nock('http://localhost:3000')
      .get('/api/plugins/')
      .reply(200, [
        {
          name: 'TestPlugin',
          url: 'http://my.plugin.com/hello/plugins/',
        },
      ]);

    const testPlugin: PluginDefinition = {
      name: 'TestPlugin',
      url: 'http://my.plugin.com/new/plugins/'
    }
    const { wrapper } = useAllProviders();
    render(<PluginEdit plugin={testPlugin}></PluginEdit>, {
      wrapper: wrapper,
    });
    await userEvent.clear(await screen.findByLabelText('edit TestPlugin plugin url'));
    await userEvent.type(
      await screen.findByLabelText('edit TestPlugin plugin url'),
      'http://my.plugin.com/new/plugins/'
    );
    expect(await screen.findByDisplayValue('http://my.plugin.com/new/plugins/')).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: 'save TestPlugin plugin' }));
    expect(await screen.findByText('Something went wrong updating the plugin')).toBeInTheDocument();
  });
});
