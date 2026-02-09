import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PatientModalFooter from '@core/patient/components/PatientModalFooter';

const mockStoreState: { syncStatus: 'idle' | 'saving' | 'synced' | 'error'; lastSyncAt: number | null } = {
  syncStatus: 'idle',
  lastSyncAt: null as number | null,
};

vi.mock('@core/stores/useAppStore', () => ({
  default: (selector?: any) => {
    if (typeof selector === 'function') {
      return selector(mockStoreState);
    }
    return mockStoreState;
  },
}));

const renderFooter = (overrides: Partial<React.ComponentProps<typeof PatientModalFooter>> = {}) => {
  const props: React.ComponentProps<typeof PatientModalFooter> = {
    onCancel: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  };

  return render(<PatientModalFooter {...props} />);
};

describe('PatientModalFooter', () => {
  beforeEach(() => {
    mockStoreState.syncStatus = 'idle';
    mockStoreState.lastSyncAt = null;
  });

  it('shows sync status label', () => {
    mockStoreState.syncStatus = 'saving';
    renderFooter();

    expect(screen.getByText('Guardando...')).toBeInTheDocument();
  });

  it('shows save button when enabled', () => {
    renderFooter({ showSave: true, saveLabel: 'Guardar' });
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });
});
