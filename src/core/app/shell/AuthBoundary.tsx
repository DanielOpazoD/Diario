import React from 'react';
import { useUser } from '@core/app/state/useAppState';
import Login from '@core/components/Login';

/**
 * Acts as the boundary between public and authenticated spaces.
 * It strictly evaluates the current user session and mounts the application
 * layout exclusively if a valid identity exists.
 */
interface AuthBoundaryProps {
    children: React.ReactNode;
}

export const AuthBoundary: React.FC<AuthBoundaryProps> = ({ children }) => {
    const user = useUser();

    if (!user) {
        return <Login />;
    }

    // Only render the authenticated shell if a user exists
    return <>{children}</>;
};
