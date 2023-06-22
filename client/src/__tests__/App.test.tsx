import { describe, expect, test } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import  App from '@/App';
import React from 'react';
import '@testing-library/jest-dom';
import { AllProviders, queryClient } from '@/mocks/setupTests';

describe('Test Feature flags', () => {

    beforeEach(() => {
        queryClient.clear();
    });

    // useIQEngineOutreach
    test('renders app component with Discord and Sign up link when no feature flag specified', () => {
        render(<App />,  { wrapper: AllProviders });
        expect(screen.getByText('Discord')).toBeInTheDocument();
        expect(screen.getByText('Sign up for a once-a-month email update on IQEngine, such as new features, demos, and more!')).toBeInTheDocument();
    });

    test('renders app component with Discord and Sign up link when flag set to true', () => {
        import.meta.env.VITE_FEATURE_FLAGS = '{"useIQEngineOutReach": true}';
        render(<App />,  { wrapper: AllProviders });
        expect(screen.getByText('Discord')).toBeInTheDocument();
        expect(screen.getByText('Sign up for a once-a-month email update on IQEngine, such as new features, demos, and more!')).toBeInTheDocument();
    });

    test('does not render app component with Discord and Sign up link when flag set to false',  async () => {
        import.meta.env.VITE_FEATURE_FLAGS = '{"useIQEngineOutReach": false}';
        render(<App />,  { wrapper: AllProviders });
        await waitForElementToBeRemoved(screen.queryByText('Discord'))
        expect(screen.queryByText('Discord')).toBeNull();
        expect(screen.queryByText('Sign up for a once-a-month email update on IQEngine, such as new features, demos, and more!')).toBeNull();
    });

    // displayIQEngineGitHub
    test('renders app component with GitHub link when no feature flag specified', () => {
        render(<App />,  { wrapper: AllProviders });
        expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    test('renders app component with GitHub link when flag set to true', () => {
        import.meta.env.VITE_FEATURE_FLAGS = '{"displayIQEngineGitHub": true}';
        render(<App />,  { wrapper: AllProviders });
        expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    test('does not render app component with GitHub link when flag set to false',  async () => {
        import.meta.env.VITE_FEATURE_FLAGS = '{"displayIQEngineGitHub": false, "useIQEngineOutReach": true}';
        render(<App />,  { wrapper: AllProviders });
        await waitForElementToBeRemoved(screen.queryByText('GitHub'))
        expect(screen.queryByText('GitHub')).toBeNull();
    });
});
