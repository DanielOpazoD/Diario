import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@use-cases/logger', () => ({
    logEvent: vi.fn(),
}));

vi.mock('lucide-react', () => ({
    AlertTriangle: (props: Record<string, unknown>) => <span data-testid="alert-icon" {...props} />,
    RefreshCw: (props: Record<string, unknown>) => <span data-testid="refresh-icon" {...props} />,
}));

import FeatureErrorBoundary from '@core/ui/FeatureErrorBoundary';
import { logEvent } from '@use-cases/logger';

const ThrowingComponent = () => {
    throw new Error('Test crash');
};

const GoodComponent = () => <div>Everything works</div>;

describe('FeatureErrorBoundary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Suppress console.error from React's error boundary
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('renders children when no error', () => {
        render(
            <FeatureErrorBoundary featureName="Test">
                <GoodComponent />
            </FeatureErrorBoundary>
        );

        expect(screen.getByText('Everything works')).toBeTruthy();
    });

    it('shows error UI with feature name when child crashes', () => {
        render(
            <FeatureErrorBoundary featureName="Estadísticas">
                <ThrowingComponent />
            </FeatureErrorBoundary>
        );

        expect(screen.getByText('Error en Estadísticas')).toBeTruthy();
        expect(screen.getByText(/Esta sección tuvo un problema/)).toBeTruthy();
        expect(screen.getByText('Test crash')).toBeTruthy();
        expect(screen.getByText('Reintentar')).toBeTruthy();
    });

    it('logs the error with feature name', () => {
        render(
            <FeatureErrorBoundary featureName="Informes">
                <ThrowingComponent />
            </FeatureErrorBoundary>
        );

        expect(logEvent).toHaveBeenCalledWith(
            'error',
            'FeatureErrorBoundary:Informes',
            'Test crash',
            expect.objectContaining({ stack: expect.any(String) })
        );
    });

    it('recovers when Reintentar is clicked', () => {
        let shouldThrow = true;

        const ConditionalCrash = () => {
            if (shouldThrow) throw new Error('Crash');
            return <div>Recovered</div>;
        };

        render(
            <FeatureErrorBoundary featureName="Test">
                <ConditionalCrash />
            </FeatureErrorBoundary>
        );

        expect(screen.getByText('Error en Test')).toBeTruthy();

        shouldThrow = false;
        fireEvent.click(screen.getByText('Reintentar'));

        expect(screen.getByText('Recovered')).toBeTruthy();
    });
});
