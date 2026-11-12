import { dev } from '@/utils/templates';
import { resolveUserRef } from '@/refs/UserRef';
const slotRegex = /(?<=^[^\s]*#)\d+/;
export default class BrancherDBClient {
    #providerClient;
    #branchesCache;
    #cacheLastFetch;
    #cacheInvalid;
    #options;
    constructor(providerClient, options) {
        this.#providerClient = providerClient;
        this.#branchesCache = [];
        this.#cacheLastFetch = new Date(0);
        this.#cacheInvalid = false;
        this.#options = options ?? {};
    }
    /** Internal methods that may possibly be useful. */
    get $util() {
        return {
            /**
             * Fetches the branches from the database provider, then caches the result
             *
             * @returns The list of fetched branches
             */
            refetchCache: async () => {
                const branches = await this.#providerClient.getAll();
                this.#branchesCache = branches;
                this.#cacheLastFetch = new Date();
                return branches;
            },
            /**
             * Marks the cache of branches from the database provider as invalid. Does NOT re-fetch the branches; if you wish
             * to immediately update the cache, use {@linkcode fetchBranches} instead.
             */
            invalidateCache: () => {
                this.#cacheInvalid = true;
            },
            /** Returns the slot number for a branch given its name */
            getBranchSlot: (branchName) => {
                const results = branchName.match(slotRegex);
                // If no result, use slot of 0 which corresponds to legacy branch
                const slotNumber = results ? Number(results[0]) : 0;
                return slotNumber;
            },
            /**
             * Gets the branch slots that a user has used
             *
             * @param userRef Target user
             * @returns An array of numbers, each corresponding to a branch slot that has been used
             */
            getUsedSlotsForUser: async (userRef) => {
                const userRefObject = resolveUserRef(userRef);
                const userBranches = await this.user.getBranches(userRefObject);
                const usedSlots = userBranches.reduce((acc, current) => {
                    const slotNumber = this.$util.getBranchSlot(current.name);
                    acc.push(slotNumber);
                    return acc;
                }, []);
                return usedSlots;
            },
            /**
             * Gets the next available branch slot for a user
             *
             * @param userRef Target user
             * @param nextUnusedSlotMethod Method for choosing the next unused user branch slot (defaults to the value from
             *   the client instance)
             * @returns A number corresponding to an unused branch slot
             */
            getNextUnusedSlotForUser: async (userRef, nextUnusedSlotMethod) => {
                const usedSlots = await this.$util.getUsedSlotsForUser(userRef);
                const method = nextUnusedSlotMethod ??
                    this.#options.nextUnusedSlotMethod ??
                    'smallest';
                switch (method) {
                    case 'smallest': {
                        // Does not include 0 because that corresponds to legacy branch name
                        let slot = 1;
                        while (usedSlots.includes(slot))
                            slot++;
                        return slot;
                    }
                    case 'iterate': {
                        return Math.max(...usedSlots) + 1;
                    }
                    default:
                        throw new Error(`Invalid method for choosing next unused slot: ${method}`);
                }
            },
        };
    }
    /** Methods to interact with database branches */
    get branch() {
        return {
            /**
             * Fetches the branches from either the cache or the branch provider, depending on whether the cache is stale or
             * invalid
             *
             * @returns The list of cached or fetched branches
             */
            getAll: async () => {
                if (this.#cacheInvalid) {
                    return await this.$util.refetchCache();
                }
                const nowMs = Date.now();
                const lastFetchMs = this.#cacheLastFetch.getTime();
                const staleTimeMs = this.#options.staleTime ?? 15000;
                if (nowMs - lastFetchMs > staleTimeMs) {
                    return await this.$util.refetchCache();
                }
                else {
                    return this.#branchesCache;
                }
            },
            /** Direct access to methods of branch provider client */
            $raw: this.#providerClient,
        };
    }
    /** Methods to interact with database branches with respect to users */
    get user() {
        return {
            /**
             * Gets the list of branches belonging to a user
             *
             * @param userRef Target user
             * @returns An array of branches belonging to that user
             */
            getBranches: async (userRef) => {
                const userRefObject = resolveUserRef(userRef);
                const allBranches = await this.branch.getAll();
                const githubUsername = await userRefObject.getGitHubUsername();
                const branchName = dev(githubUsername.toLowerCase());
                const escapedBranchName = branchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const allPersonBranchesRegex = new RegExp(`^${escapedBranchName}(?=[# ]+|$)`);
                const userBranches = allBranches.filter((branch) => allPersonBranchesRegex.test(branch.name.toLowerCase()));
                return userBranches;
            },
            /**
             * Gets the branch in the specified slot belonging to a user
             *
             * @param userRef Target user
             * @param slot Target slot
             * @returns A branch belonging to that user
             */
            getBranch: async (userRef, slot) => {
                const userBranches = await this.user.getBranches(userRef);
                const branch = userBranches.find((branch) => {
                    const slotNumber = this.$util.getBranchSlot(branch.name);
                    return slot === slotNumber;
                });
                if (!branch) {
                    throw new Error(`Could not find branch at slot ${slot} for user identified by ${userRef.toString()}`);
                }
                return branch;
            },
            /**
             * Creates a new database branch for a user
             *
             * @param userRef Target user
             * @param note Short description explaining purpose of the branch
             * @param nextUnusedSlotMethod Method for choosing the next unused user branch slot (defaults to the value from
             *   this class's instance)
             * @returns The new database branch
             */
            createBranch: async (userRef, note, nextUnusedSlotMethod) => {
                const userRefObject = resolveUserRef(userRef);
                const githubUsername = await userRefObject.getGitHubUsername();
                const nextUnusedSlot = await this.$util.getNextUnusedSlotForUser(userRef, nextUnusedSlotMethod);
                const branchName = dev(githubUsername.toLowerCase(), nextUnusedSlot, note);
                const newBranch = await this.branch.$raw.create(branchName);
                // Reset connection string to prevent branch from having same role password as parent branch
                this.branch.$raw.resetConnectionURL({ id: newBranch.id });
                this.$util.invalidateCache();
                return newBranch;
            },
            /**
             * Creates a new database branch for a user and returns its connection string
             *
             * @param userRef Target user
             * @param note Short description explaining purpose of the branch
             * @param nextUnusedSlotMethod Method for choosing the next unused user branch slot (defaults to the value from
             *   this class's instance)
             * @returns The database connection URL string
             */
            createBranchAndConnect: async (userRef, note, nextUnusedSlotMethod) => {
                const newBranch = await this.user.createBranch(userRef, note, nextUnusedSlotMethod);
                const uri = await this.branch.$raw.getConnectionURL({
                    id: newBranch.id,
                });
                return uri;
            },
            /**
             * Gets the database connection URL for a user's branch at a specified slot
             *
             * @param userRef Target user
             * @param slot Integer corresponding to the target slot
             * @returns {string} The database connection URL string
             */
            getConnectionURL: async (userRef, slot) => {
                this.user.getBranches(userRef);
                const targetBranch = await this.user.getBranch(userRef, slot);
                if (!targetBranch) {
                    throw new Error(`Could not find branch at slot ${slot}`);
                }
                const uri = await this.branch.$raw.getConnectionURL({
                    id: targetBranch.id,
                });
                return uri;
            },
            /**
             * Deletes a user's database branch at a specified slot
             *
             * @param userRef Target user
             * @param slot Integer corresponding to the target slot
             */
            deleteBranch: async (userRef, slot) => {
                this.user.getBranches(userRef);
                const targetBranch = await this.user.getBranch(userRef, slot);
                if (!targetBranch) {
                    throw new Error(`Could not find branch at slot ${slot}`);
                }
                return await this.branch.$raw.delete({ id: targetBranch.id });
            },
        };
    }
}
