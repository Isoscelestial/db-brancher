import { OnlyOneRequired } from '@/utils/types';

/** Either an object of fields or a class instance that refer to a branch */
export type BranchRef = BranchRefObject | OnlyOneRequired<BranchFields>;

/**
 * Resolves a branch ref, which may either be an object of fields or a class instance, to a class instance
 *
 * @param branchRef The branch ref
 * @returns A class instance for a branch
 */
export function resolveBranchRef(branchRef: BranchRef): BranchRefObject {
  return branchRef instanceof BranchRefObject
    ? branchRef
    : new BranchRefObject(branchRef);
}

/** An object of fields that refer to a branch */
export type BranchFields = {
  id: string;
  name: string;
};

/**
 * An object constructed from {@linkcode BranchFields} that provides utility methods for delaying data fetching until the
 * last possible moment.
 */
export class BranchRefObject {
  #fields: OnlyOneRequired<BranchFields>;

  constructor(fields: OnlyOneRequired<BranchFields>) {
    this.#fields = fields;
  }

  /** Static method that functions as a copy constructor for either a ref object or default constructor fields. */
  static copyFrom(branchRef: BranchRef): BranchRefObject {
    return branchRef instanceof BranchRefObject
      ? new this(branchRef.#fields)
      : new BranchRefObject(branchRef);
  }

  async getId(
    getBranches: () => Promise<BranchFields[]>,
  ): Promise<BranchFields['id']> {
    const fields = this.#fields;
    if (fields.id) {
      return fields.id;
    } else if (fields.name) {
      const targetName = fields.name;
      const branchesList = await getBranches();
      const result = branchesList.find((b) => b.name === targetName)?.id;
      if (!result)
        throw new Error(`Could not find branch with name "${targetName}"`);
      return result;
    }
    throw new Error('Could not find ID of branch');
  }

  async getName(
    getBranches: () => Promise<BranchFields[]>,
  ): Promise<BranchFields['name']> {
    const fields = this.#fields;
    if (fields.name) {
      return fields.name;
    } else if (fields.id) {
      const targetId = fields.id;
      const branchesList = await getBranches();
      const result = branchesList.find((b) => b.id === targetId)?.name;
      if (!result) throw new Error(`Could not find branch with ID ${targetId}`);
      return result;
    }
    throw new Error('Could not find name of branch');
  }

  /**
   * Calls the getters for every ref field ahead of time, since getters may be asyncronous.
   *
   * @param getBranches Callback function that returns a searchable array of all branches
   * @returns A promise of an array with every ref field
   */
  prefill(getBranches: () => Promise<BranchFields[]>) {
    return Promise.all([this.getId(getBranches), this.getName(getBranches)]);
  }

  /** Whether every field has been filled */
  isFilled(): boolean {
    return Object.values(this.#fields).every(Boolean);
  }
}
