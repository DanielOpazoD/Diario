import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode, MouseEvent } from 'react';

interface LocationLike {
  pathname: string;
  search: string;
}

interface NavigationOptions {
  replace?: boolean;
}

interface RouterContextValue {
  location: LocationLike;
  navigate: (to: string, options?: NavigationOptions) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

const normalizePath = (path: string): string => {
  if (!path) return '/';
  const trimmed = path.startsWith('/') ? path : `/${path}`;
  return trimmed.replace(/\/$/, '') || '/';
};

function useRouterContext(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('Router context is not available. Wrap your app with <BrowserRouter>.');
  }
  return ctx;
}

export const BrowserRouter: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationLike>(() => ({
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
    search: typeof window !== 'undefined' ? window.location.search : '',
  }));

  useEffect(() => {
    const handlePopState = () => {
      setLocation({ pathname: window.location.pathname, search: window.location.search });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string, options?: NavigationOptions) => {
    const target = normalizePath(to);
    if (options?.replace) {
      window.history.replaceState(null, '', target);
    } else {
      window.history.pushState(null, '', target);
    }
    setLocation({ pathname: window.location.pathname, search: window.location.search });
  };

  const value = useMemo(() => ({ location, navigate }), [location]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export interface RouteProps {
  path: string;
  element: ReactNode;
}

const matchPath = (routePath: string, currentPath: string) => {
  if (routePath === '*' || routePath === '/*') return true;
  const normalizedRoute = normalizePath(routePath);
  const normalizedPath = normalizePath(currentPath);
  if (normalizedRoute.endsWith('/*')) {
    return normalizedPath.startsWith(normalizedRoute.replace(/\*+$/, ''));
  }
  return normalizedRoute === normalizedPath;
};

export const Routes: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { location } = useRouterContext();
  const routes = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<RouteProps>[];
  const match = routes.find(route => matchPath(route.props.path, location.pathname));

  return match ? <>{match.props.element}</> : null;
};

export const Route: React.FC<RouteProps> = () => null;

export const Navigate: React.FC<{ to: string; replace?: boolean }> = ({ to, replace }) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);

  return null;
};

export const useNavigate = () => useRouterContext().navigate;

export const useLocation = () => useRouterContext().location;

export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }> = ({ to, onClick, children, ...rest }) => {
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onClick?.(event);
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};

export const NavLink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  className?: string | ((props: { isActive: boolean }) => string);
}> = ({ to, className, children, ...rest }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isActive = normalizePath(pathname) === normalizePath(to);

  const resolvedClassName =
    typeof className === 'function'
      ? (className as (props: { isActive: boolean }) => string)({ isActive })
      : className;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(to);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={resolvedClassName}
      aria-current={isActive ? 'page' : undefined}
      {...rest}
    >
      {children}
    </a>
  );
};

export const Outlet: React.FC = () => null;
