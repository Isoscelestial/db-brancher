import { NeonClient } from '@neon/sdk';
import { Branch } from '@neon/sdk';
import BranchProviderClient from './BranchProviderClient';
import { BranchRef } from '@/refs/BranchRef';
export type NeonProviderClientConfig = {
    apiKey: string;
    projectId: string;
    apiURL?: string;
    neonClient?: NeonClient;
};
export default class NeonProviderClient extends BranchProviderClient<Branch> {
    projectId: string;
    neonClient: NeonClient;
    config: NeonProviderClientConfig;
    constructor(config: NeonProviderClientConfig);
    getAll(): Promise<Branch[]>;
    create(branchName: string): Promise<Branch>;
    delete(branchRef: BranchRef): Promise<void>;
    resetConnectionURL(branchRef: BranchRef): Promise<void>;
    getConnectionURL(branchRef: BranchRef, pooled: boolean): Promise<string>;
}
//# sourceMappingURL=Neon.d.ts.map