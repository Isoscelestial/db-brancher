import NeonProviderClient from '@/providers/Neon';

export const neonBranchProvider = new NeonProviderClient({
  apiKey: process.env.NEON_API_KEY!,
  projectId: process.env.NEON_PROJECT_ID!,
  apiURL: process.env.NEON_API_URL!,
});

describe('NeonProviderClient', () => {
  test('Config matches .env.test', () => {
    const config = neonBranchProvider.config;
    expect(neonBranchProvider.projectId).toBe(process.env.NEON_PROJECT_ID);
    expect(config.apiKey).toBe(process.env.NEON_API_KEY);
    expect(config.projectId).toBe(process.env.NEON_PROJECT_ID);
    if (process.env.NEON_API_URL) {
      expect(config.apiURL).toBe(process.env.NEON_API_URL);
    }
  });
});
