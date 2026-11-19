import { dev } from './templates';
/** Matches a valid GitHub username */
export const GitHubUsernameRegex = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;
/** Matches the slot number of a branch's name */
export const slotRegex = /(?<=^[^\s]*#)\d+/;
export const constructAllUserBranchesRegex = (githubUsername) => {
    const branchName = dev(githubUsername.toLowerCase());
    const escapedBranchName = branchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const allPersonBranchesRegex = new RegExp(`^${escapedBranchName}(?=[# ]+|$)`);
    return allPersonBranchesRegex;
};
