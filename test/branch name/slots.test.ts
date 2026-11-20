import BrancherDBClient from '@/BrancherDBClient';
import MockProviderClient from '@/providers/Mock';
import { BranchFields } from '@/refs/BranchRef';
import { UserRef } from '@/refs/UserRef';
import { BranchSlot } from '@/utils/types';

const initialGlobalBranches: BranchFields[] = [
  { name: 'dev/user', id: 'a' },
  { name: 'dev/user#0', id: '0' },
  { name: 'dev/user#1', id: '1' },
  { name: 'dev/user#2', id: '2' },
  { name: 'dev/user#5', id: '5' },
] as const;

const initialNestedBranches: BranchFields[] = [
  { name: 'dev/user#1', id: '1' },
  { name: 'dev/user#1-1', id: '1-1' },
  { name: 'dev/user#1-2', id: '1-2' },
  { name: 'dev/user#2', id: '2' },
  { name: 'dev/user#3', id: '3' },
  { name: 'dev/user#3-1', id: '3-1' },
  { name: 'dev/user#4', id: '4' },
  { name: 'dev/user#4-1', id: '4-1' },
  { name: 'dev/user#4-2', id: '4-2' },
  { name: 'dev/user#4-2-1', id: '4-2-1' },
  { name: 'dev/user#4-2-1-1', id: '4-2-1-1' },
  { name: 'dev/user#4-2-1-2', id: '4-2-1-2' },
  { name: 'dev/user#4-2-2', id: '4-2-2' },
  { name: 'dev/user#4-2-4', id: '4-2-4' },
  { name: 'dev/user#4-3', id: '4-3' },
  { name: 'dev/user#5', id: '5' },
  { name: 'dev/user#5-1', id: '5-1' },
  { name: 'dev/user#5-1-1', id: '5-1-1' },
  { name: 'dev/user#5-1-1-1', id: '5-1-1-1' },
  { name: 'dev/user#5-1-1-1-1', id: '5-1-1-1-1' },
  { name: 'dev/user#8', id: '8' },
  { name: 'dev/user#8-1', id: '8-1' },
] as const;

const initialUsedSlots: BranchSlot<'nested'>[] = [
  [1],
  [1, 1],
  [1, 2],
  [2],
  [3],
  [3, 1],
  [4],
  [4, 1],
  [4, 2],
  [4, 2, 1],
  [4, 2, 1, 1],
  [4, 2, 1, 2],
  [4, 2, 2],
  [4, 2, 4],
  [4, 3],
  [5],
  [5, 1],
  [5, 1, 1],
  [5, 1, 1, 1],
  [5, 1, 1, 1, 1],
  [8],
  [8, 1],
] as const;

const u: UserRef = { name: 'user' };

describe('Slot utilities w/ global syntax', () => {
  const memoryBranchProvider = new MockProviderClient({
    initialBranches: initialGlobalBranches,
  });
  const brancher = new BrancherDBClient(memoryBranchProvider, {
    slotSyntax: 'global',
  });

  test('getUsedSlotsForUser', () => {
    expect(brancher.$util.getBranchSlot('dev/user')).toEqual(0);
    expect(brancher.$util.getBranchSlot('dev/user#0')).toEqual(0);
    expect(brancher.$util.getBranchSlot('dev/user#1')).toEqual(1);
    expect(brancher.$util.getBranchSlot('dev/user#2')).toEqual(2);
  });

  test('getUsedSlotsForUser', async () => {
    const usedSlots = await brancher.$util.getUsedSlotsForUser(u);
    expect(usedSlots).toEqual([0, 0, 1, 2, 5]);
  });

  test('getNextUnusedSlotForUser (smallest)', async () => {
    const nextUnusedSlot: BranchSlot =
      await brancher.$util.getNextUnusedSlotForUser(u, {
        nextUnusedSlotMethod: 'smallest',
      });
    expect(nextUnusedSlot).toEqual(3);
  });

  test('getNextUnusedSlotForUser (iterate)', async () => {
    const nextUnusedSlot: BranchSlot =
      await brancher.$util.getNextUnusedSlotForUser(u, {
        nextUnusedSlotMethod: 'iterate',
      });
    expect(nextUnusedSlot).toEqual(6);
  });
});

describe('Slot utilities w/ nested syntax', () => {
  const memoryBranchProvider = new MockProviderClient({
    initialBranches: initialNestedBranches,
  });
  const brancher = new BrancherDBClient(memoryBranchProvider, {
    slotSyntax: 'nested',
  });

  test('getUsedSlotsForUser', () => {
    expect(brancher.$util.getBranchSlot('dev/user')).toEqual([0]);
    expect(brancher.$util.getBranchSlot('dev/user#0')).toEqual([0]);
    expect(brancher.$util.getBranchSlot('dev/user#1')).toEqual([1]);
    expect(brancher.$util.getBranchSlot('dev/user#1-1')).toEqual([1, 1]);
    expect(brancher.$util.getBranchSlot('dev/user#1-2')).toEqual([1, 2]);
    expect(brancher.$util.getBranchSlot('dev/user#2')).toEqual([2]);
  });

  test('getUsedSlotsForUser', async () => {
    const usedSlots = await brancher.$util.getUsedSlotsForUser(u);
    expect(usedSlots).toEqual(initialUsedSlots);
  });

  test('getNextUnusedSlotForUser (smallest)', async () => {
    const testSlot = (parentSlot?: BranchSlot<'nested'>) =>
      brancher.$util.getNextUnusedSlotForUser(u, {
        parentSlot,
        nextUnusedSlotMethod: 'smallest',
      });

    expect(await testSlot()).toEqual([6]);
    expect(await testSlot([])).toEqual([6]);
    expect(await testSlot([1])).toEqual([1, 3]);
    expect(await testSlot([1, 1])).toEqual([1, 1, 1]);
    expect(await testSlot([1, 1, 1])).toEqual([1, 1, 1, 1]); // Doesn't exist but should still work
    expect(await testSlot([4, 2])).toEqual([4, 2, 3]);
  });

  test('getNextUnusedSlotForUser (iterate)', async () => {
    const testSlot = (parentSlot?: BranchSlot<'nested'>) =>
      brancher.$util.getNextUnusedSlotForUser(u, {
        parentSlot,
        nextUnusedSlotMethod: 'iterate',
      });

    expect(await testSlot()).toEqual([9]);
    expect(await testSlot([])).toEqual([9]);
    expect(await testSlot([1])).toEqual([1, 3]);
    expect(await testSlot([1, 1])).toEqual([1, 1, 1]);
    expect(await testSlot([1, 1, 1])).toEqual([1, 1, 1, 1]); // Doesn't exist but should still work
    expect(await testSlot([4, 2])).toEqual([4, 2, 5]);
  });
});
