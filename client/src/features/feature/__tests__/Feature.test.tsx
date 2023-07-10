import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Feature from '@/features/feature/Feature';
import React from 'react';
import '@testing-library/jest-dom';
import { AllProviders } from '@/mocks/setupTests';

describe('Test Feature flags', () => {
  test('Renders when true', async () => {
    render(<Feature flag={'true'}>Test</Feature>, { wrapper: AllProviders });
    expect(screen.getByText('Test')).toBeInTheDocument;
  });

  test('Renders when null', async () => {
    render(<Feature flag={null}>Test</Feature>, { wrapper: AllProviders });
    expect(screen.getByText('Test')).toBeInTheDocument;
  });

  test('Does not render when false', async () => {
    render(<Feature flag={'false'}>Test</Feature>, { wrapper: AllProviders });
    expect(screen.getByText('Test')).not.toBeInTheDocument;
  });
});
