import BrancherDBClient from '@/BrancherDBClient';
import { user } from '@/identifiers/UserIdentifier';
import NeonProviderClient from '@/providers/Neon';
import env from './env';

const branchProvider = new NeonProviderClient({
  apiKey: env.NEON_API_KEY,
  projectId: env.NEON_PROJECT_ID,
});

const brancher = new BrancherDBClient(branchProvider);

////////////////////////////////////////////////////////////////////////////////

const u = user({ githubUsername: 'torvalds' });

// Get all branches
const branches = await brancher.branch.getAll();
console.log(branches);

// Create branch
const newBranch = await brancher.user.createBranch(u, 'new branch!');
console.log('new', newBranch);

// Get user branches
const userBranches = await brancher.user.getBranches(u);
console.log(userBranches);

// Get connection URL
const uri = await brancher.user.getConnectionURL(u, 1);
console.log('uri', uri);

// Delete branch
// await brancher.user.deleteBranch(u, 0);

// Get user branches
const userBranches2 = await brancher.user.getBranches(u);
console.log(userBranches2);
