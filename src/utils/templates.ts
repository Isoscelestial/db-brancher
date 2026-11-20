import { BranchSlot } from './types';

/**
 * Constructs the branch name belonging to a particular GitHub username
 *
 * @param githubUsername The person this branch belongs to
 * @param slot A positive integer that selects a branch per person. If 0, omits the slot suffix (i.e. uses legacy branch
 *   name system)
 * @param note A string to append to the end of the branch name
 * @returns
 */
export function dev(
  githubUsername: string,
  slot?: BranchSlot,
  note?: string,
): string {
  const tiers = typeof slot === 'number' ? [slot] : slot;

  if (tiers && !tiers?.every((tier) => Number.isInteger(tier) && tier >= 0)) {
    throw new Error(`Invalid slot ${slot} for branch name`);
  }

  // Wildcard branch, or legacy branch name
  if (!tiers || tiers[0] === 0) return `dev/${githubUsername}`;

  return `dev/${githubUsername}#${tiers.join('-')}${note ? ` ${note}` : ''}`;
}

/** Constructs a branch name based off a GitHub branch. */
export function preview(gitBranch: string): string {
  return `preview/${gitBranch}`;
}
