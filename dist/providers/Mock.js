import { resolveBranchRef } from '../refs/BranchRef.js';
import BranchProviderClient from './BranchProviderClient';
import { randomUUID } from 'node:crypto';
export default class MockProviderClient extends BranchProviderClient {
    branches;
    constructor(config) {
        super();
        this.branches = config?.initialBranches ?? [];
    }
    async getAll() {
        return this.branches;
    }
    async create(branchName) {
        const newBranch = { name: branchName, id: randomUUID() };
        this.branches.push(newBranch);
        return newBranch;
    }
    async delete(branchRef) {
        const branchRefObject = resolveBranchRef(branchRef);
        const branchId = await branchRefObject.getId(this.getAll);
        const targetIndex = this.branches.findIndex((branch) => branch.id === branchId);
        this.branches.splice(targetIndex, 1);
    }
    resetConnectionURL(branchRef) {
        throw new Error('Method not implemented.');
    }
    getConnectionURL(branchRef, pooled) {
        throw new Error('Method not implemented.');
    }
    resetFromParent(branchRef) {
        throw new Error('Method not implemented.');
    }
}
