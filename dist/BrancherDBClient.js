import { dev } from './utils/templates.js';
import { resolveUserRef } from './refs/UserRef.js';
import { constructAllUserBranchesRegex, slotRegex } from './utils/regex.js';
const arrayStartsWith = (array, prefix) => array.length >= prefix.length &&
    prefix.every((value, index) => value === array[index]);
const areSlotsEqual = (slotA, slotB) => {
    const a = typeof slotA === 'number' ? [slotA] : slotA;
    const b = typeof slotB === 'number' ? [slotB] : slotB;
    return a.length === b.length && a.every((v, i) => v === b[i]);
};
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
                if (!results) {
                    switch (this.#options.slotSyntax) {
                        case 'global':
                            return 0;
                        default:
                        case 'nested':
                            return [0];
                    }
                }
                const slotTiers = results.map((match) => Number(match));
                if (slotTiers.length > 1 && this.#options.slotSyntax === 'global') {
                    throw new Error(`Branch "${branchName}" is using nested syntax instead of configured global syntax.`);
                }
                switch (this.#options.slotSyntax) {
                    case 'global':
                        return slotTiers[slotTiers.length - 1];
                    default:
                    case 'nested':
                        return slotTiers;
                }
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
                const usedSlots = userBranches.reduce((acc, branch) => {
                    const branchSlot = this.$util.getBranchSlot(branch.name);
                    acc.push(branchSlot);
                    return acc;
                }, []);
                return usedSlots;
            },
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
            getNextUnusedSlotForUser: async (userRef, options) => {
                const allUsedSlots = await this.$util.getUsedSlotsForUser(userRef);
                const method = options?.nextUnusedSlotMethod ??
                    this.#options.nextUnusedSlotMethod ??
                    'smallest';
                const syntax = this.#options.slotSyntax ?? 'nested';
                const parentSlot = options?.parentSlot ?? [];
                if (method !== 'smallest' && method !== 'iterate') {
                    throw new Error(`Invalid method for choosing next unused slot: ${method}`);
                }
                let tierUsedSlots;
                switch (syntax) {
                    case 'global': {
                        tierUsedSlots = allUsedSlots;
                        break;
                    }
                    default:
                    case 'nested': {
                        const allNestedUsedSlots = allUsedSlots;
                        tierUsedSlots = allNestedUsedSlots.flatMap((slot) => arrayStartsWith(slot, parentSlot)
                            ? slot.toSpliced(0, parentSlot.length)
                            : []);
                        break;
                    }
                }
                let nextUnusedSlotForTier;
                switch (method) {
                    default:
                    case 'smallest': {
                        // Does not include 0 because that corresponds to legacy branch name
                        let slot = 1;
                        while (tierUsedSlots.includes(slot))
                            slot++;
                        nextUnusedSlotForTier = slot;
                        break;
                    }
                    case 'iterate': {
                        nextUnusedSlotForTier =
                            tierUsedSlots.length > 0 ? Math.max(...tierUsedSlots) + 1 : 1;
                        break;
                    }
                }
                if (syntax === 'nested') {
                    return [...parentSlot, nextUnusedSlotForTier];
                }
                return nextUnusedSlotForTier;
            },
            /**
             * Fetches the parent branch of a branch given its slot using nested syntax.
             *
             * @param userRef Target user
             * @param slot Slot of target branch
             * @returns A branch that is the parent of the target branch
             */
            getParentBranch: async (userRef, slot) => {
                const parentSlot = await this.$util.getParentSlot(userRef, slot);
                if (!parentSlot)
                    return undefined;
                return await this.user.getBranch(userRef, parentSlot);
            },
            /**
             * Fetches the slot of a branch's parent given its slot using nested syntax.
             *
             * @param userRef Target user
             * @param slot Slot of target branch
             * @returns The slot of the target branch's parent
             */
            getParentSlot: async (userRef, slot) => {
                const syntax = this.#options.slotSyntax ?? 'nested';
                if (syntax === 'global') {
                    console.error(`Cannot find the parent of the branch at slot ${slot} for user ${JSON.stringify(userRef)} when using the global slot syntax`);
                    return undefined;
                }
                const slotArray = typeof slot === 'number' ? [slot] : slot;
                slotArray.pop();
                if (slotArray.length === 0)
                    return undefined;
                return slotArray;
            },
            /**
             * Fetches child branches of a parent branch given its slot using nested syntax.
             *
             * @param userRef Target user
             * @param slot Slot of target branch
             * @returns An array of slots that correspond to child branches of the target branch
             */
            getChildSlots: async (userRef, slot) => {
                const syntax = this.#options.slotSyntax ?? 'nested';
                if (syntax === 'global') {
                    console.error(`Cannot find children of the branch at slot ${slot} for user ${JSON.stringify(userRef)} when using the global slot syntax`);
                    return undefined;
                }
                const slotArray = typeof slot === 'number' ? [slot] : slot;
                const allUsedSlots = await this.$util.getUsedSlotsForUser(userRef);
                const allNestedUsedSlots = allUsedSlots;
                const childrenSlots = allNestedUsedSlots.flatMap((slot) => arrayStartsWith(slot, slotArray)
                    ? slot.toSpliced(0, slotArray.length)
                    : []);
                if (childrenSlots.length === 0)
                    return undefined;
                return childrenSlots;
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
                const userName = await userRefObject.getName();
                const allPersonBranchesRegex = constructAllUserBranchesRegex(userName);
                const userBranches = allBranches.filter((branch) => allPersonBranchesRegex.test(branch.name.toLowerCase()));
                return userBranches;
            },
            /**
             * Gets the branch in the specified slot belonging to a user
             *
             * @param userRef Target user
             * @param slot Slot of target branch
             * @returns A branch belonging to that user
             */
            getBranch: async (userRef, slot) => {
                const userBranches = await this.user.getBranches(userRef);
                const branch = userBranches.find((branch) => {
                    const slotNumber = this.$util.getBranchSlot(branch.name);
                    return areSlotsEqual(slot, slotNumber);
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
             * @param options Optional configurations related to creating a database branch
             * @returns The new database branch
             */
            createBranch: async (userRef, options) => {
                const userRefObject = resolveUserRef(userRef);
                const userName = await userRefObject.getName();
                const parentSlot = typeof options?.parentSlot === 'number'
                    ? [options?.parentSlot]
                    : options?.parentSlot;
                const nextUnusedSlot = await this.$util.getNextUnusedSlotForUser(userRef, {
                    parentSlot,
                    nextUnusedSlotMethod: options?.nextUnusedSlotMethod,
                });
                let parentBranch = undefined;
                if (parentSlot) {
                    parentBranch = await this.user.getBranch(userRef, parentSlot);
                    if (!parentBranch) {
                        throw new Error(`Could not find parent branch at slot ${parentSlot}`);
                    }
                }
                const branchName = dev(userName.toLowerCase(), nextUnusedSlot, options?.note);
                const newBranch = await this.branch.$raw.create(branchName, parentBranch);
                // Reset connection string to prevent branch from having same role password as parent branch
                this.branch.$raw.resetConnectionURL({ id: newBranch.id });
                this.$util.invalidateCache();
                return newBranch;
            },
            /**
             * Creates a new database branch for a user and returns its connection string
             *
             * @param userRef Target user
             * @param options Optional configurations related to creating a database branch
             * @returns The database connection URL string
             */
            createBranchAndConnect: async (userRef, options) => {
                const newBranch = await this.user.createBranch(userRef, options);
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
            resetBranchFromParent: async (userRef, slot) => {
                const targetBranch = await this.user.getBranch(userRef, slot);
                if (!targetBranch) {
                    throw new Error(`Could not find branch at slot ${slot}`);
                }
                return await this.branch.$raw.resetFromParent(targetBranch);
            },
        };
    }
}
