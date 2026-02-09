import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAppActions } from '@core/app/state/useAppActions';

describe('useAppActions', () => {
  it('exposes core actions from the store', () => {
    let actions: any = null;

    const Probe = () => {
      actions = useAppActions();
      return null;
    };

    render(<Probe />);

    expect(actions).toBeTruthy();
    if (!actions) return;
    expect(typeof actions.logout).toBe('function');
    expect(typeof actions.addToast).toBe('function');
    expect(typeof actions.setRecords).toBe('function');
    expect(typeof actions.setGeneralTasks).toBe('function');
    expect(typeof actions.addPatient).toBe('function');
    expect(typeof actions.updatePatient).toBe('function');
    expect(typeof actions.deletePatient).toBe('function');
    expect(typeof actions.setBookmarks).toBe('function');
    expect(typeof actions.setBookmarkCategories).toBe('function');
    expect(typeof actions.setPatientTypes).toBe('function');
  });
});
