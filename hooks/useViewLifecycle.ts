import { useEffect, useLayoutEffect, RefObject } from 'react';
import { ViewMode } from '../types';
import { prefetchAdjacentViews } from './usePrefetch';

const useViewLifecycle = (viewMode: ViewMode, contentRef: RefObject<HTMLDivElement>) => {
  useEffect(() => {
    prefetchAdjacentViews(viewMode);
  }, [viewMode]);

  useLayoutEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [viewMode, contentRef]);
};

export default useViewLifecycle;
