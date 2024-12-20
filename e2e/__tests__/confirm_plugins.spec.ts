import { test, expect } from '@playwright/test';

test('List plugins and params @CICompatible', async ({ request }) => {
  const response = await request.get(`/api/plugins`);
  // remove entry with Local as the name
  const plugins = (await response.json()).filter((plugin) => plugin.name !== 'Local' && plugin.name !== 'BuiltIn');
  console.log(plugins);
  // get url of first item
  const url = plugins[0].url;
  // do a GET on url
  const response2 = await request.get(url);
  const plugin_list = await response2.json();
  // expect there to be an item of value "gain_stage"
  expect(plugin_list).toContain('gain_stage');
  const response3 = await request.get(url + '/gain_stage');
  const plugin_params = await response3.json();
  expect(plugin_params).toHaveProperty('gain');
});

test('Make sure GNU Radio works @CICompatible', async ({ request }) => {
  const response = await request.get(`/api/plugins`);
  const plugins = (await response.json()).filter((plugin) => plugin.name !== 'Local' && plugin.name !== 'BuiltIn');
  // eg https://iqengine-staging-plugins.agreeableforest-695e4014.eastus2.azurecontainerapps.io/plugins
  const response2 = await request.get(plugins + '/test-gnuradio');
  await expect(response2).toBeOK();
});
