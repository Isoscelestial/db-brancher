import { BranchFields, BranchRef } from '../refs/BranchRef.js';
import BranchProviderClient from './BranchProviderClient';
export type MockBranch = BranchFields;
export type MockProviderClientConfig = {
    initialBranches?: MockBranch[];
};
export default class MockProviderClient extends BranchProviderClient<MockBranch> {
    branches: MockBranch[];
    constructor(config?: MockProviderClientConfig);
    getAll(): Promise<MockBranch[]>;
    create(branchName: string): Promise<MockBranch>;
    delete(branchRef: BranchRef): Promise<void>;
    resetConnectionURL(branchRef: BranchRef): Promise<void>;
    getConnectionURL(branchRef: BranchRef, pooled?: boolean): Promise<string>;
    resetFromParent(branchRef: BranchRef): Promise<void | MockBranch>;
}
//# sourceMappingURL=Mock.d.ts.map