import { dev } from './templates';

/** Matches a valid GitHub username */
export const GitHubUsernameRegex =
  /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

/** Matches the slot number(s) in a branch's name */
export const slotRegex = /(?<=^[^\s]*#[\d-]*)\d+/g;

export const constructAllUserBranchesRegex = (name: string) => {
  const branchName = dev(name.toLowerCase());
  const escapedBranchName = branchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const allPersonBranchesRegex = new RegExp(`^${escapedBranchName}(?=[# ]+|$)`);
  return allPersonBranchesRegex;
};
