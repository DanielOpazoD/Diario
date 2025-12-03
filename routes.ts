import { ViewMode } from './types';

export const VIEW_ROUTES: Record<ViewMode, string> = {
  daily: '/pacientes',
  stats: '/estadisticas',
  tasks: '/tareas',
  bookmarks: '/marcadores',
  history: '/historial',
  settings: '/configuracion',
};

export const DEFAULT_ROUTE = VIEW_ROUTES.daily;

export function viewFromPath(pathname: string): ViewMode {
  const normalizedPath = pathname.split('?')[0].replace(/\/$/, '') || '/';
  const match = (Object.entries(VIEW_ROUTES) as Array<[ViewMode, string]>).find(([, routePath]) => {
    const normalizedRoute = routePath.replace(/\/$/, '') || '/';
    return normalizedRoute === normalizedPath;
  });

  return match ? match[0] : 'daily';
}

export function pathFromView(viewMode: ViewMode): string {
  return VIEW_ROUTES[viewMode] || DEFAULT_ROUTE;
}
