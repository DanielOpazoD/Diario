import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the dependencies before importing the service
vi.mock('@core/stores/useAppStore', () => ({
    default: {
        subscribe: vi.fn(),
        getState: vi.fn(() => ({
            records: [],
            generalTasks: [],
            bookmarks: [],
            bookmarkCategories: [],
            user: null,
            theme: 'light',
            patientTypes: [],
            securityPin: null,
            autoLockMinutes: 5,
            highlightPendingPatients: true,
            compactStats: false,
            showBookmarkBar: true,
            syncStatus: 'idle',
            lastSyncAt: null,
            setSyncStatus: vi.fn(),
        })),
    },
}));

vi.mock('@use-cases/storage', () => ({
    loadRecordsFromLocal: vi.fn(() => []),
    loadGeneralTasksFromLocal: vi.fn(() => []),
    loadBookmarksFromLocal: vi.fn(() => []),
    loadBookmarkCategoriesFromLocal: vi.fn(() => []),
    saveRecordsToLocal: vi.fn(),
    saveGeneralTasksToLocal: vi.fn(),
    saveBookmarksToLocal: vi.fn(),
    saveBookmarkCategoriesToLocal: vi.fn(),
}));

vi.mock('@data/adapters/firebasePatientSyncAdapter', () => ({
    firebasePatientSyncAdapter: {
        syncPatients: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@services/logger', () => ({
    emitStructuredLog: vi.fn(),
}));

describe('persistenceService', () => {
    let mockSubscribe: ReturnType<typeof vi.fn>;
    const baseState = {
        records: [],
        generalTasks: [],
        bookmarks: [],
        bookmarkCategories: [],
        user: null,
        theme: 'light',
        patientTypes: [],
        securityPin: null,
        autoLockMinutes: 5,
        highlightPendingPatients: true,
        compactStats: false,
        showBookmarkBar: true,
    };

    beforeEach(async () => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        const { resetPersistenceForTests } = await import('@core/app/persistence');
        resetPersistenceForTests();

        // Get the mocked subscribe function
        const useAppStore = (await import('@core/stores/useAppStore')).default as unknown as {
            subscribe: ReturnType<typeof vi.fn>;
        };
        mockSubscribe = useAppStore.subscribe;
    });

    afterEach(async () => {
        // Ensure singleton subscription state does not leak between tests.
        const { resetPersistenceForTests } = await import('@core/app/persistence');
        resetPersistenceForTests();
        vi.useRealTimers();
    });

    describe('initPersistence', () => {
        it('should subscribe to store changes', async () => {
            const { initPersistence } = await import('@core/app/persistence');

            initPersistence();

            expect(mockSubscribe).toHaveBeenCalledOnce();
            expect(typeof mockSubscribe.mock.calls[0][0]).toBe('function');
            expect(typeof mockSubscribe.mock.calls[0][1]).toBe('function');
        });

        it('should debounce save operations', async () => {
            const { initPersistence } = await import('@core/app/persistence');
            const { saveRecordsToLocal } = await import('@use-cases/storage');

            // Initialize and get the subscription callback
            initPersistence();
            const callback = mockSubscribe.mock.calls[0][1];

            // Trigger multiple state changes quickly
            callback({ ...baseState, records: [{ id: '1' }] });
            callback({ ...baseState, records: [{ id: '2' }] });
            callback({ ...baseState, records: [{ id: '3' }] });

            // Before timeout, save should not be called
            expect(saveRecordsToLocal).not.toHaveBeenCalled();

            // After 2000ms, save should be called once (debounced)
            await vi.advanceTimersByTimeAsync(2000);

            expect(saveRecordsToLocal).toHaveBeenCalledOnce();
        });

        it('should save user to localStorage when present', async () => {
            const { initPersistence } = await import('@core/app/persistence');
            const localStorageSpy = vi.spyOn(window.localStorage, 'setItem');

            initPersistence();
            const callback = mockSubscribe.mock.calls[0][1];

            const testUser = { name: 'Test', email: 'test@test.com', avatar: 'url' };
            callback({ ...baseState, user: testUser, records: [] });

            await vi.advanceTimersByTimeAsync(2000);

            expect(localStorageSpy).toHaveBeenCalledWith(
                expect.any(String),
                JSON.stringify(testUser)
            );
        });

        it('should sync to Firebase after LocalStorage save', async () => {
            const { initPersistence } = await import('@core/app/persistence');
            const { firebasePatientSyncAdapter } = await import('@data/adapters/firebasePatientSyncAdapter');

            initPersistence();
            const callback = mockSubscribe.mock.calls[0][1];

            const testRecords = [{ id: '1', name: 'Patient 1' }];
            callback({ ...baseState, records: testRecords, user: { name: 'Test', email: 'test@test.com', avatar: 'url' } });

            await vi.advanceTimersByTimeAsync(2000);

            expect(firebasePatientSyncAdapter.syncPatients).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ id: '1', name: 'Patient 1' }),
                ])
            );
        });

        it('should not sync to Firebase without user', async () => {
            const { initPersistence } = await import('@core/app/persistence');
            const { firebasePatientSyncAdapter } = await import('@data/adapters/firebasePatientSyncAdapter');

            initPersistence();
            const callback = mockSubscribe.mock.calls[0][1];

            callback({ ...baseState, records: [{ id: '1', name: 'Patient 1' }], user: null });

            await vi.advanceTimersByTimeAsync(2000);

            expect(firebasePatientSyncAdapter.syncPatients).not.toHaveBeenCalled();
        });

        it('should avoid re-sync when records are unchanged', async () => {
            const { initPersistence } = await import('@core/app/persistence');
            const { firebasePatientSyncAdapter } = await import('@data/adapters/firebasePatientSyncAdapter');

            initPersistence();
            const callback = mockSubscribe.mock.calls[0][1];

            const testRecords = [{ id: '1', name: 'Patient 1', updatedAt: 10 }];
            const user = { name: 'Test', email: 'test@test.com', avatar: 'url' };

            callback({ ...baseState, records: testRecords, user });
            await vi.advanceTimersByTimeAsync(2000);
            callback({ ...baseState, records: testRecords, user });
            await vi.advanceTimersByTimeAsync(2000);

            expect(firebasePatientSyncAdapter.syncPatients).toHaveBeenCalledTimes(1);
        });
    });
});
