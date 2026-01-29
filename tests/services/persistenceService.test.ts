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
        })),
    },
}));

vi.mock('@services/storage', () => ({
    saveRecordsToLocal: vi.fn(),
    saveGeneralTasksToLocal: vi.fn(),
    saveBookmarksToLocal: vi.fn(),
    saveBookmarkCategoriesToLocal: vi.fn(),
}));

vi.mock('@services/firebaseService', () => ({
    syncPatientsToFirebase: vi.fn().mockResolvedValue(undefined),
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

        // Get the mocked subscribe function
        const useAppStore = (await import('@core/stores/useAppStore')).default;
        mockSubscribe = useAppStore.subscribe;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('initPersistence', () => {
        it('should subscribe to store changes', async () => {
            const { initPersistence } = await import('@services/persistenceService');

            initPersistence();

            expect(mockSubscribe).toHaveBeenCalledOnce();
            expect(typeof mockSubscribe.mock.calls[0][0]).toBe('function');
        });

        it('should debounce save operations', async () => {
            const { initPersistence } = await import('@services/persistenceService');
            const { saveRecordsToLocal } = await import('@services/storage');

            // Initialize and get the subscription callback
            initPersistence();
            const callback = mockSubscribe.mock.calls[0][0];

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
            const { initPersistence } = await import('@services/persistenceService');
            const localStorageSpy = vi.spyOn(window.localStorage, 'setItem');

            initPersistence();
            const callback = mockSubscribe.mock.calls[0][0];

            const testUser = { name: 'Test', email: 'test@test.com', avatar: 'url' };
            callback({ ...baseState, user: testUser, records: [] });

            await vi.advanceTimersByTimeAsync(2000);

            expect(localStorageSpy).toHaveBeenCalledWith(
                expect.any(String),
                JSON.stringify(testUser)
            );
        });

        it('should sync to Firebase after LocalStorage save', async () => {
            const { initPersistence } = await import('@services/persistenceService');
            const { syncPatientsToFirebase } = await import('@services/firebaseService');

            initPersistence();
            const callback = mockSubscribe.mock.calls[0][0];

            const testRecords = [{ id: '1', name: 'Patient 1' }];
            callback({ ...baseState, records: testRecords, user: { name: 'Test', email: 'test@test.com', avatar: 'url' } });

            await vi.advanceTimersByTimeAsync(2000);

            expect(syncPatientsToFirebase).toHaveBeenCalledWith(testRecords);
        });
    });
});
