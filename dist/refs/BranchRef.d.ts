import { OnlyOneRequired } from '@/utils/types';
/** Either an object of fields or a class instance that refer to a branch */
export type BranchRef = BranchRefObject | OnlyOneRequired<BranchFields>;
/**
 * Resolves a branch ref, which may either be an object of fields or a class instance, to a class instance
 *
 * @param branchRef The branch ref
 * @returns A class instance for a branch
 */
export declare function resolveBranchRef(branchRef: BranchRef): BranchRefObject;
/** An object of fields that refer to a branch */
export type BranchFields = {
    id: string;
    name: string;
};
/**
 * An object constructed from {@linkcode BranchFields} that provides utility methods for delaying data fetching until the
 * last possible moment.
 */
export declare class BranchRefObject {
    #private;
    constructor(fields: OnlyOneRequired<BranchFields>);
    /** Static method that functions as a copy constructor for either a ref object or default constructor fields. */
    static copyFrom(branchRef: BranchRef): BranchRefObject;
    getId(getBranches: () => Promise<BranchFields[]>): Promise<BranchFields['id']>;
    getName(getBranches: () => Promise<BranchFields[]>): Promise<BranchFields['name']>;
    /**
     * Calls the getters for every ref field ahead of time, since getters may be asyncronous.
     *
     * @param getBranches Callback function that returns a searchable array of all branches
     * @returns A promise of an array with every ref field
     */
    prefill(getBranches: () => Promise<BranchFields[]>): Promise<[string, string]>;
    /** Whether every field has been filled */
    isFilled(): boolean;
}
//# sourceMappingURL=BranchRef.d.ts.map