import { describe, expect, test } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import  App from '@/App';
import React from 'react';
import '@testing-library/jest-dom';
import { FFProviders } from '@/mocks/setupTests';

describe('Test Feature flags', () => {

    test('renders app component with Discord and Sign up link when no feature flag specified', () => {
        render(<App />,  { wrapper: FFProviders });
        expect(screen.getByText('Discord')).toBeInTheDocument();
        expect(screen.getByText('Sign up for a once-a-month email update on IQEngine, such as new features, demos, and more!')).toBeInTheDocument();
    });

    test('renders app component with Discord and Sign up link when flag set to true', () => {
        import.meta.env.VITE_FEATURE_FLAGS = '{"useIQEngineOutReach": true}';
        render(<App />,  { wrapper: FFProviders });
        expect(screen.getByText('Discord')).toBeInTheDocument();
        expect(screen.getByText('Sign up for a once-a-month email update on IQEngine, such as new features, demos, and more!')).toBeInTheDocument();
    });

    test('does not render app component with Discord and Sign up link when flag set to false',  async () => {
        import.meta.env.VITE_FEATURE_FLAGS = '{"useIQEngineOutReach": false}';
        render(<App />,  { wrapper: FFProviders });
        await waitForElementToBeRemoved(screen.queryByText('Discord'))
        expect(screen.queryByText('Discord')).toBeNull();
        expect(screen.queryByText('Sign up for a once-a-month email update on IQEngine, such as new features, demos, and more!')).toBeNull();
    });
});
