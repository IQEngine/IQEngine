import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { Config } from './Config';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const fullApiHandler = rest.get('/api/config', (req, res, ctx) => {
  return res(
    ctx.json({
      detectorEndpoint: 'http://some-detector-endpoint',
      connectionInfo: { some: 'connection-info' },
      googleAnalyticsKey: 'UA-SOME_KEY-1',
    })
  );
});

export const emptyApiHandler = rest.get('/api/config', (req, res, ctx) => {
  return res(ctx.status(200), ctx.json({}));
});

describe('Config contains information from environment', () => {
  const fullWorker = setupServer(fullApiHandler);
  const emptyWorker = setupServer(emptyApiHandler);
  beforeAll(() => {
    import.meta.env.VITE_DETECTOR_ENDPOINT = 'http://127.0.0.1:8000/detectors/';
    import.meta.env.VITE_CONNECTION_INFO = '{}';
    import.meta.env.VITE_GOOGLE_ANALYTICS_KEY = 'UA-TEST-KEY-1';
  });
  afterAll(() => {
    delete import.meta.env.VITE_DETECTOR_ENDPOINT;
    delete import.meta.env.VITE_CONNECTION_INFO;
    delete import.meta.env.VITE_GOOGLE_ANALYTICS_KEY;
  });

  test('config can get information from environment variable', async () => {
    // Assert
    emptyWorker.listen();

    // Act
    const config = await Config.Initialize();
    // Assert

    expect(config.detectorEndpoint).toBe('http://127.0.0.1:8000/detectors/');
    expect(config.connectionInfo).toMatchObject({});
    expect(config.googleAnalyticsKey).toBe('UA-TEST-KEY-1');
    emptyWorker.close();
  });
  test('config from env it is overridden by result from API', async () => {
    // Arrange
    fullWorker.listen();
    // Act
    const config = await Config.Initialize();
    // Assert
    expect(config.detectorEndpoint).toBe('http://some-detector-endpoint');
    expect(config.connectionInfo).toMatchObject({ some: 'connection-info' });
    expect(config.googleAnalyticsKey).toBe('UA-SOME_KEY-1');

    fullWorker.close();
  });
});
