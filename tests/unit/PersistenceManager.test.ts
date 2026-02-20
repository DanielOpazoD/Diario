import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersistenceManager, PersistenceState, PersistenceDependencies } from '../../src/core/app/PersistenceManager';
import { getPatientSyncStateSignature } from '../../src/use-cases/patient/syncState';

// Mock the sync state signature module
vi.mock('../../src/use-cases/patient/syncState', () => ({
    getPatientSyncStateSignature: vi.fn(),
}));

describe('PersistenceManager', () => {
    let deps: PersistenceDependencies;
    let manager: PersistenceManager;
    let mockState: PersistenceState;

    beforeEach(() => {
        vi.clearAllMocks();

        deps = {
            saveToLocal: vi.fn(),
            shadowWrite: vi.fn().mockResolvedValue(undefined),
            syncToRemote: vi.fn().mockResolvedValue(undefined),
            onSyncStatusChange: vi.fn(),
            logEvent: vi.fn(),
            syncCooldownMs: 1000,
            maxConsecutiveFailures: 3,
            cooldownLogWindowMs: 500,
        };

        manager = new PersistenceManager(deps);

        mockState = {
            records: [],
            generalTasks: [],
            bookmarks: [],
            bookmarkCategories: [],
            user: null,
            theme: 'system',
            patientTypes: [],
            securityPinHash: null,
            securityPinSalt: null,
            autoLockMinutes: 0,
            highlightPendingPatients: false,
            compactStats: false,
            showBookmarkBar: false,
        };
    });

    describe('persistSnapshot', () => {
        it('always saves to local storage and shadow db', async () => {
            await manager.persistSnapshot(mockState);

            expect(deps.saveToLocal).toHaveBeenCalledWith(mockState);
            expect(deps.shadowWrite).toHaveBeenCalledWith(mockState);
        });

        it('syncs as "synced" without user (offline state)', async () => {
            const now = Date.now();
            await manager.persistSnapshot(mockState, now);

            expect(deps.onSyncStatusChange).toHaveBeenCalledWith('synced', now);
            expect(deps.syncToRemote).not.toHaveBeenCalled();
        });

        it('identifies and syncs dirty patients when user is logged in', async () => {
            const mockUser = { name: 'Test', email: 'test@test.com', avatar: '' };
            mockState.user = mockUser;

            const patient = { id: 'p1', updatedAt: 1000 } as any;
            mockState.records = [patient];

            vi.mocked(getPatientSyncStateSignature).mockReturnValue('hash1');

            const now = Date.now();
            await manager.persistSnapshot(mockState, now);

            expect(getPatientSyncStateSignature).toHaveBeenCalledWith(patient);
            expect(deps.syncToRemote).toHaveBeenCalledWith([patient], mockUser);
            expect(deps.onSyncStatusChange).toHaveBeenCalledWith('synced', expect.any(Number));
        });

        it('does not sync if no patients are dirty', async () => {
            const mockUser = { name: 'Test', email: 'test@test.com', avatar: '' };
            mockState.user = mockUser;

            const patient = { id: 'p1', updatedAt: 1000 } as any;
            mockState.records = [patient];

            vi.mocked(getPatientSyncStateSignature).mockReturnValue('hash1');

            // First sync to store the hash
            await manager.persistSnapshot(mockState, Date.now());
            expect(deps.syncToRemote).toHaveBeenCalledTimes(1);

            // Second sync should skip remote
            vi.mocked(deps.syncToRemote).mockClear();
            await manager.persistSnapshot(mockState, Date.now() + 100);

            expect(deps.syncToRemote).not.toHaveBeenCalled();
            expect(deps.onSyncStatusChange).toHaveBeenCalledWith('synced', expect.any(Number));
        });

        it('handles sync failures and applies cooldown after max re-tries', async () => {
            const mockUser = { name: 'Test', email: 'test@test.com', avatar: '' };
            mockState.user = mockUser;
            const patient = { id: 'p1', updatedAt: 1000 } as any;
            mockState.records = [patient];

            // Mock a failure
            vi.mocked(deps.syncToRemote).mockRejectedValue(new Error('Network error'));
            vi.mocked(getPatientSyncStateSignature).mockReturnValue('hash-changing');

            const now = Date.now();

            // Try to sync up to the max failures
            for (let i = 0; i < deps.maxConsecutiveFailures; i++) {
                await manager.persistSnapshot(mockState, now + i * 10);
                expect(deps.onSyncStatusChange).toHaveBeenLastCalledWith('error');
                expect(deps.syncToRemote).toHaveBeenCalledTimes(i + 1);
            }

            // The next sync should be blocked by cooldown
            vi.mocked(deps.syncToRemote).mockClear();
            await manager.persistSnapshot(mockState, now + 100);

            expect(deps.syncToRemote).not.toHaveBeenCalled();
            expect(deps.onSyncStatusChange).toHaveBeenLastCalledWith('error');
        });

        it('logs warning if shadow write fails', async () => {
            const error = new Error('IDB fail');
            vi.mocked(deps.shadowWrite).mockRejectedValue(error);

            await manager.persistSnapshot(mockState);

            // Need to wait for next microtask since catch is chained on promise without await
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(deps.logEvent).toHaveBeenCalledWith('warn', 'Persistence', 'IndexedDB shadow write failed', { error });
        });
    });

    describe('resetState', () => {
        it('clears sync history and limits', async () => {
            const mockUser = { name: 'Test', email: 'test@test.com', avatar: '' };
            mockState.user = mockUser;
            const patient = { id: 'p1' } as any;
            mockState.records = [patient];
            vi.mocked(getPatientSyncStateSignature).mockReturnValue('hash1');

            // Sync once to populate state
            await manager.persistSnapshot(mockState, Date.now());
            expect(deps.syncToRemote).toHaveBeenCalledTimes(1);

            manager.resetState();

            // Should sync again because history was cleared
            vi.mocked(deps.syncToRemote).mockClear();
            await manager.persistSnapshot(mockState, Date.now() + 10);
            expect(deps.syncToRemote).toHaveBeenCalledTimes(1);
        });
    });
});
