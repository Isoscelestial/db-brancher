/** Matches a valid GitHub username */
export declare const GitHubUsernameRegex: RegExp;
/**
 * Constructs the branch name belonging to a particular GitHub username
 *
 * @param githubUsername The person this branch belongs to
 * @param slot A positive integer that selects a branch per person. If 0, omits the slot suffix (i.e. uses legacy branch
 *   name system)
 * @param note A string to append to the end of the branch name
 * @returns
 */
export declare function dev(githubUsername: string, slot?: number, note?: string): string;
/** Constructs a branch name based off a GitHub branch. */
export declare function preview(gitBranch: string): string;
//# sourceMappingURL=templates.d.ts.map