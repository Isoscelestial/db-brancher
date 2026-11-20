import { BranchFields } from './refs/BranchRef.js';
import { UserRef } from './refs/UserRef.js';
import BranchProviderClient from './providers/BranchProviderClient.js';
import { BranchSlot, BranchSlotSyntax } from './utils/types';
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
    /**
     * Syntax for how to format the branch's slot in its name.
     *
     * - `"global"` - Uses single unique integer (e.g. `#3`)
     * - `"nested"` - Uses multiple integers to indicate parent-child relationships, where each tier is a unique integer
     *   (e.g. `#2-1`)
     *
     * @default 'nested'
     */
    slotSyntax?: BranchSlotSyntax;
};
export default class BrancherDBClient<BranchType extends BranchFields, Options extends BrancherDBClientOptions = BrancherDBClientOptions> {
    #private;
    constructor(providerClient: BranchProviderClient<BranchType>, options?: Options);
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
        getBranchSlot: (branchName: string) => BranchSlot;
        /**
         * Gets the branch slots that a user has used
         *
         * @param userRef Target user
         * @returns An array of numbers, each corresponding to a branch slot that has been used
         */
        getUsedSlotsForUser: (userRef: UserRef) => Promise<BranchSlot[]>;
        /**
         * Gets the next available branch slot for a user
         *
         * @param userRef Target user
         * @param options.parentSlot Parent slot to find the next unused child slot in. Only useful if
         *   {@linkcode BrancherDBClientOptions.slotSyntax | slotSyntax} is `"nested"`
         * @param options.nextUnusedSlotMethod Method for choosing the next unused user branch slot (defaults to the value
         *   from the client instance)
         * @returns A number corresponding to an unused branch slot
         */
        getNextUnusedSlotForUser: (userRef: UserRef, options?: {
            parentSlot?: BranchSlot<"nested">;
            nextUnusedSlotMethod?: BrancherDBClientOptions["nextUnusedSlotMethod"];
        }) => Promise<BranchSlot>;
        /**
         * Fetches the parent branch of a branch given its slot using nested syntax.
         *
         * @param userRef Target user
         * @param slot Slot of target branch
         * @returns A branch that is the parent of the target branch
         */
        getParentBranch: (userRef: UserRef, slot: BranchSlot) => Promise<BranchType | undefined>;
        /**
         * Fetches the slot of a branch's parent given its slot using nested syntax.
         *
         * @param userRef Target user
         * @param slot Slot of target branch
         * @returns The slot of the target branch's parent
         */
        getParentSlot: (userRef: UserRef, slot: BranchSlot) => Promise<BranchSlot | undefined>;
        /**
         * Fetches child branches of a parent branch given its slot using nested syntax.
         *
         * @param userRef Target user
         * @param slot Slot of target branch
         * @returns An array of slots that correspond to child branches of the target branch
         */
        getChildSlots: (userRef: UserRef, slot: BranchSlot) => Promise<BranchSlot[] | undefined>;
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
         * @param slot Slot of target branch
         * @returns A branch belonging to that user
         */
        getBranch: (userRef: UserRef, slot: BranchSlot) => Promise<BranchType>;
        /**
         * Creates a new database branch for a user
         *
         * @param userRef Target user
         * @param options Optional configurations related to creating a database branch
         * @returns The new database branch
         */
        createBranch: (userRef: UserRef, options?: CreateBranchOptions) => Promise<BranchType>;
        /**
         * Creates a new database branch for a user and returns its connection string
         *
         * @param userRef Target user
         * @param options Optional configurations related to creating a database branch
         * @returns The database connection URL string
         */
        createBranchAndConnect: (userRef: UserRef, options?: CreateBranchOptions) => Promise<string>;
        /**
         * Gets the database connection URL for a user's branch at a specified slot
         *
         * @param userRef Target user
         * @param slot Integer corresponding to the target slot
         * @returns {string} The database connection URL string
         */
        getConnectionURL: (userRef: UserRef, slot: BranchSlot) => Promise<string>;
        /**
         * Deletes a user's database branch at a specified slot
         *
         * @param userRef Target user
         * @param slot Integer corresponding to the target slot
         */
        deleteBranch: (userRef: UserRef, slot: BranchSlot) => Promise<void>;
        resetBranchFromParent: (userRef: UserRef, slot: BranchSlot) => Promise<void | BranchType>;
    };
}
/** Optional configurations for methods involving creating a database branch */
export type CreateBranchOptions = {
    /** Short description explaining purpose of the branch */
    note?: string;
    /** Method for choosing the next unused user branch slot (defaults to the value from this class's instance) */
    nextUnusedSlotMethod?: BrancherDBClientOptions['nextUnusedSlotMethod'];
    /** Uses this branch as the parent of the created branch (as a source for initial data) */
    parentSlot?: BranchSlot;
};
//# sourceMappingURL=BrancherDBClient.d.ts.map