import { test as setup, expect } from '@playwright/test';

setup('install database', async ({ request }) => {
  const response = await request.get('/api/datasources');
});
