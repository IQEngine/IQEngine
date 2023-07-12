import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Users from '@/pages/admin/pages/users';
import '@testing-library/jest-dom';
import React from 'react';

describe('Test Users', () => {
  test('Basic Rendering', async () => {
    render(<Users></Users>);
    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
  });
});
