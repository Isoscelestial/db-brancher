/**
 * Constructs the branch name belonging to a particular username
 *
 * @param username The person this branch belongs to
 * @param slot A positive integer that selects a branch per person. If 0, omits the slot suffix (i.e. uses legacy branch
 *   name system)
 * @param note A string to append to the end of the branch name
 * @returns
 */
export function dev(username, slot, note) {
    const tiers = typeof slot === 'number' ? [slot] : slot;
    if (tiers && !tiers?.every((tier) => Number.isInteger(tier) && tier >= 0)) {
        throw new Error(`Invalid slot ${slot} for branch name`);
    }
    // Wildcard branch, or legacy branch name
    if (!tiers || tiers[0] === 0)
        return `dev/${username}`;
    return `dev/${username}#${tiers.join('-')}${note ? ` ${note}` : ''}`;
}
/** Constructs a branch name based off a GitHub branch. */
export function preview(gitBranch) {
    return `preview/${gitBranch}`;
}
