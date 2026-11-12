import { BranchFields, BranchRef } from '@/identifiers/BranchIdentifier';

export default abstract class BranchProviderClient<
  BranchType extends BranchFields,
> {
  /**
   * Fetches all the branches
   *
   * @returns The list of cached or fetched branches
   */
  abstract getAll(): Promise<BranchType[]>;

  /**
   * Creates a database branch
   *
   * @param branchName Target branch
   */
  abstract create(branchName: string): Promise<BranchType>;

  /**
   * Deletes a database branch
   *
   * @param branchRef Target branch
   */
  abstract delete(branchRef: BranchRef): Promise<void>;

  /**
   * Resets/rotates the connection string for a database branch
   *
   * @param branchRef Target branch
   */
  abstract resetConnectionURL(branchRef: BranchRef): Promise<void>;

  /**
   * Gets the database connection URL for a specific branch
   *
   * @param branchRef Target branch
   * @param pooled Whether to use connection pooling (defaults to `true`). [More information on connection
   *   pooling](https://neon.com/docs/connect/connection-pooling)
   * @returns {string} The database connection URL string
   */
  abstract getConnectionURL(
    branchRef: BranchRef,
    pooled?: boolean,
  ): Promise<string>;
}
