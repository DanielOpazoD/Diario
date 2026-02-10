import { useEffect, useRef } from 'react';
import reportStyles from '@features/reports/reportStyles.css?raw';

export const useReportStyleMount = () => {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (styleRef.current || typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.id = 'report-style';
    style.textContent = reportStyles;
    document.head.appendChild(style);
    styleRef.current = style;

    const previousTheme = document.body.dataset.theme;
    document.body.classList.add('reports-print');
    document.body.dataset.theme = 'light';

    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
      document.body.classList.remove('reports-print');
      if (previousTheme) {
        document.body.dataset.theme = previousTheme;
      } else {
        delete document.body.dataset.theme;
      }
    };
  }, []);
};
