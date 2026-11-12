import { BranchFields } from '@/refs/BranchRef';
import { UserRef } from '@/refs/UserRef';
import BranchProviderClient from '@/providers/BranchProviderClient';
export type BrancherDBClientOptions = {
    /**
     * Number of milliseconds before cached branches are considered stale and will be refetched.
     *
     * @default 15000
     */
    staleTime?: number;
    /**
     * Method for choosing the next unused user branch slot
     *
     * - `"smallest"` - Choose the smallest unused number
     * - `"iterate"` - Choose the number that suceeds the largest used number
     *
     * @default 'smallest'
     */
    nextUnusedSlotMethod?: 'smallest' | 'iterate';
};
export default class BrancherDBClient<BranchType extends BranchFields> {
    #private;
    constructor(providerClient: BranchProviderClient<BranchType>, options?: BrancherDBClientOptions);
    /** Internal methods that may possibly be useful. */
    get $util(): {
        /**
         * Fetches the branches from the database provider, then caches the result
         *
         * @returns The list of fetched branches
         */
        refetchCache: () => Promise<BranchType[]>;
        /**
         * Marks the cache of branches from the database provider as invalid. Does NOT re-fetch the branches; if you wish
         * to immediately update the cache, use {@linkcode fetchBranches} instead.
         */
        invalidateCache: () => void;
        /** Returns the slot number for a branch given its name */
        getBranchSlot: (branchName: string) => number;
        /**
         * Gets the branch slots that a user has used
         *
         * @param userRef Target user
         * @returns An array of numbers, each corresponding to a branch slot that has been used
         */
        getUsedSlotsForUser: (userRef: UserRef) => Promise<number[]>;
        /**
         * Gets the next available branch slot for a user
         *
         * @param userRef Target user
         * @param nextUnusedSlotMethod Method for choosing the next unused user branch slot (defaults to the value from
         *   the client instance)
         * @returns A number corresponding to an unused branch slot
         */
        getNextUnusedSlotForUser: (userRef: UserRef, nextUnusedSlotMethod?: BrancherDBClientOptions["nextUnusedSlotMethod"]) => Promise<number>;
    };
    /** Methods to interact with database branches */
    get branch(): {
        /**
         * Fetches the branches from either the cache or the branch provider, depending on whether the cache is stale or
         * invalid
         *
         * @returns The list of cached or fetched branches
         */
        getAll: () => Promise<BranchType[]>;
        /** Direct access to methods of branch provider client */
        $raw: BranchProviderClient<BranchType>;
    };
    /** Methods to interact with database branches with respect to users */
    get user(): {
        /**
         * Gets the list of branches belonging to a user
         *
         * @param userRef Target user
         * @returns An array of branches belonging to that user
         */
        getBranches: (userRef: UserRef) => Promise<BranchType[]>;
        /**
         * Gets the branch in the specified slot belonging to a user
         *
         * @param userRef Target user
         * @param slot Target slot
         * @returns A branch belonging to that user
         */
        getBranch: (userRef: UserRef, slot: number) => Promise<BranchType>;
        /**
         * Creates a new database branch for a user
         *
         * @param userRef Target user
         * @param note Short description explaining purpose of the branch
         * @param nextUnusedSlotMethod Method for choosing the next unused user branch slot (defaults to the value from
         *   this class's instance)
         * @returns The new database branch
         */
        createBranch: (userRef: UserRef, note?: string, nextUnusedSlotMethod?: BrancherDBClientOptions["nextUnusedSlotMethod"]) => Promise<BranchType>;
        /**
         * Creates a new database branch for a user and returns its connection string
         *
         * @param userRef Target user
         * @param note Short description explaining purpose of the branch
         * @param nextUnusedSlotMethod Method for choosing the next unused user branch slot (defaults to the value from
         *   this class's instance)
         * @returns The database connection URL string
         */
        createBranchAndConnect: (userRef: UserRef, note?: string, nextUnusedSlotMethod?: BrancherDBClientOptions["nextUnusedSlotMethod"]) => Promise<string>;
        /**
         * Gets the database connection URL for a user's branch at a specified slot
         *
         * @param userRef Target user
         * @param slot Integer corresponding to the target slot
         * @returns {string} The database connection URL string
         */
        getConnectionURL: (userRef: UserRef, slot: number) => Promise<string>;
        /**
         * Deletes a user's database branch at a specified slot
         *
         * @param userRef Target user
         * @param slot Integer corresponding to the target slot
         */
        deleteBranch: (userRef: UserRef, slot: number) => Promise<void>;
    };
}
//# sourceMappingURL=BrancherDBClient.d.ts.map