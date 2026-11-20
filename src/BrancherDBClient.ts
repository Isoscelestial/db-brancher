import { dev } from '@/utils/templates';
import { BranchFields } from '@/refs/BranchRef';
import { resolveUserRef, UserRef } from '@/refs/UserRef';
import BranchProviderClient from '@/providers/BranchProviderClient';
import { constructAllUserBranchesRegex, slotRegex } from '@/utils/regex';
import { BranchSlot, BranchSlotSyntax } from './utils/types';

const arrayStartsWith = <T>(array: T[], prefix: T[]) =>
  array.length >= prefix.length &&
  prefix.every((value, index) => value === array[index]);

const areSlotsEqual = (slotA: BranchSlot, slotB: BranchSlot): boolean => {
  const a = typeof slotA === 'number' ? [slotA] : slotA;
  const b = typeof slotB === 'number' ? [slotB] : slotB;

  return a.length === b.length && a.every((v, i) => v === b[i]);
};

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

export default class BrancherDBClient<
  BranchType extends BranchFields,
  Options extends BrancherDBClientOptions = BrancherDBClientOptions,
> {
  #providerClient: BranchProviderClient<BranchType>;
  #branchesCache: BranchType[];
  #cacheLastFetch: Date;
  #cacheInvalid: boolean;
  #options: Options;

  constructor(
    providerClient: BranchProviderClient<BranchType>,
    options?: Options,
  ) {
    this.#providerClient = providerClient;
    this.#branchesCache = [];
    this.#cacheLastFetch = new Date(0);
    this.#cacheInvalid = false;
    this.#options = options ?? ({} as Options);
  }

  /** Internal methods that may possibly be useful. */
  get $util() {
    return {
      /**
       * Fetches the branches from the database provider, then caches the result
       *
       * @returns The list of fetched branches
       */
      refetchCache: async (): Promise<BranchType[]> => {
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
      getBranchSlot: (branchName: string): BranchSlot => {
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
          throw new Error(
            `Branch "${branchName}" is using nested syntax instead of configured global syntax.`,
          );
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
      getUsedSlotsForUser: async (userRef: UserRef): Promise<BranchSlot[]> => {
        const userRefObject = resolveUserRef(userRef);
        const userBranches = await this.user.getBranches(userRefObject);

        const usedSlots: BranchSlot[] = userBranches.reduce((acc, branch) => {
          const branchSlot = this.$util.getBranchSlot(branch.name);
          acc.push(branchSlot);
          return acc;
        }, [] as BranchSlot[]);

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
      getNextUnusedSlotForUser: async (
        userRef: UserRef,
        options?: {
          parentSlot?: BranchSlot<'nested'>;
          nextUnusedSlotMethod?: BrancherDBClientOptions['nextUnusedSlotMethod'];
        },
      ): Promise<BranchSlot> => {
        const allUsedSlots = await this.$util.getUsedSlotsForUser(userRef);
        const method =
          options?.nextUnusedSlotMethod ??
          this.#options.nextUnusedSlotMethod ??
          'smallest';
        const syntax = this.#options.slotSyntax ?? 'nested';
        const parentSlot = options?.parentSlot ?? [];

        if (method !== 'smallest' && method !== 'iterate') {
          throw new Error(
            `Invalid method for choosing next unused slot: ${method}`,
          );
        }

        let tierUsedSlots: number[];

        switch (syntax) {
          case 'global': {
            tierUsedSlots = allUsedSlots as BranchSlot<'global'>[];
            break;
          }

          default:
          case 'nested': {
            const allNestedUsedSlots = allUsedSlots as BranchSlot<'nested'>[];
            tierUsedSlots = allNestedUsedSlots.flatMap((slot) =>
              arrayStartsWith(slot, parentSlot)
                ? slot.toSpliced(0, parentSlot.length)
                : [],
            );
            break;
          }
        }

        let nextUnusedSlotForTier: number;

        switch (method) {
          default:
          case 'smallest': {
            // Does not include 0 because that corresponds to legacy branch name
            let slot = 1;
            while (tierUsedSlots.includes(slot)) slot++;
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
      getAll: async (): Promise<BranchType[]> => {
        if (this.#cacheInvalid) {
          return await this.$util.refetchCache();
        }

        const nowMs = Date.now();
        const lastFetchMs = this.#cacheLastFetch.getTime();
        const staleTimeMs = this.#options.staleTime ?? 15000;

        if (nowMs - lastFetchMs > staleTimeMs) {
          return await this.$util.refetchCache();
        } else {
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
      getBranches: async (userRef: UserRef): Promise<BranchType[]> => {
        const userRefObject = resolveUserRef(userRef);

        const allBranches = await this.branch.getAll();

        const userName = await userRefObject.getName();

        const allPersonBranchesRegex =
          constructAllUserBranchesRegex(userName);

        const userBranches = allBranches.filter((branch) =>
          allPersonBranchesRegex.test(branch.name.toLowerCase()),
        );

        return userBranches;
      },

      /**
       * Gets the branch in the specified slot belonging to a user
       *
       * @param userRef Target user
       * @param slot Target slot
       * @returns A branch belonging to that user
       */
      getBranch: async (
        userRef: UserRef,
        slot: BranchSlot,
      ): Promise<BranchType> => {
        const userBranches = await this.user.getBranches(userRef);

        const branch = userBranches.find((branch) => {
          const slotNumber = this.$util.getBranchSlot(branch.name);
          return areSlotsEqual(slot, slotNumber);
        });

        if (!branch) {
          throw new Error(
            `Could not find branch at slot ${slot} for user identified by ${userRef.toString()}`,
          );
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
      createBranch: async (
        userRef: UserRef,
        note?: string,
        nextUnusedSlotMethod?: BrancherDBClientOptions['nextUnusedSlotMethod'],
      ): Promise<BranchType> => {
        const userRefObject = resolveUserRef(userRef);
        const userName = await userRefObject.getName();
        const nextUnusedSlot = await this.$util.getNextUnusedSlotForUser(
          userRef,
          { nextUnusedSlotMethod },
        );

        const branchName = dev(
          userName.toLowerCase(),
          nextUnusedSlot,
          note,
        );

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
      createBranchAndConnect: async (
        userRef: UserRef,
        note?: string,
        nextUnusedSlotMethod?: BrancherDBClientOptions['nextUnusedSlotMethod'],
      ): Promise<string> => {
        const newBranch = await this.user.createBranch(
          userRef,
          note,
          nextUnusedSlotMethod,
        );
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
      getConnectionURL: async (
        userRef: UserRef,
        slot: BranchSlot,
      ): Promise<string> => {
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
      deleteBranch: async (userRef: UserRef, slot: BranchSlot) => {
        this.user.getBranches(userRef);

        const targetBranch = await this.user.getBranch(userRef, slot);
        if (!targetBranch) {
          throw new Error(`Could not find branch at slot ${slot}`);
        }

        return await this.branch.$raw.delete({ id: targetBranch.id });
      },

      resetBranchFromParent: async (userRef: UserRef, slot: BranchSlot) => {
        const targetBranch = await this.user.getBranch(userRef, slot);
        if (!targetBranch) {
          throw new Error(`Could not find branch at slot ${slot}`);
        }

        return await this.branch.$raw.resetFromParent(targetBranch);
      },
    };
  }
}
