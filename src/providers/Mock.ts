import { BranchFields, BranchRef, resolveBranchRef } from '@/refs/BranchRef';
import BranchProviderClient from './BranchProviderClient';
import { randomUUID } from 'node:crypto';

export type MockBranch = BranchFields;

export type MockProviderClientConfig = {
  initialBranches?: MockBranch[];
};

export default class MockProviderClient extends BranchProviderClient<MockBranch> {
  branches: MockBranch[];

  constructor(config?: MockProviderClientConfig) {
    super();
    this.branches = config?.initialBranches ?? [];
  }

  async getAll(): Promise<MockBranch[]> {
    return this.branches;
  }

  async create(branchName: string): Promise<MockBranch> {
    const newBranch: MockBranch = { name: branchName, id: randomUUID() };
    this.branches.push(newBranch);
    return newBranch;
  }

  async delete(branchRef: BranchRef): Promise<void> {
    const branchRefObject = resolveBranchRef(branchRef);
    const branchId = await branchRefObject.getId(this.getAll);

    const targetIndex = this.branches.findIndex(
      (branch) => branch.id === branchId,
    );
    this.branches.splice(targetIndex, 1);
  }

  resetConnectionURL(branchRef: BranchRef): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getConnectionURL(branchRef: BranchRef, pooled?: boolean): Promise<string> {
    throw new Error('Method not implemented.');
  }

  resetFromParent(branchRef: BranchRef): Promise<void | MockBranch> {
    throw new Error('Method not implemented.');
  }
}
