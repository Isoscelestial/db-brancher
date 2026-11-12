import { BranchRef, BranchRefObject, resolveBranchRef } from '@/refs/BranchRef';

describe('BranchRef', () => {
  test('Field types', () => {
    expectTypeOf({ id: 'id' }).toExtend<BranchRef>();
    expectTypeOf({ name: 'name' }).toExtend<BranchRef>();
    expectTypeOf({ id: 'id', name: 'name' }).toExtend<BranchRef>();
    expectTypeOf({}).not.toExtend<BranchRef>();
  });

  const ref: BranchRef = { id: 'id', name: 'name' };
  const obj = new BranchRefObject(ref);

  test('constructor', () => {
    expect(obj).toBeInstanceOf(BranchRefObject);
  });

  describe('resolveBranchRef', () => {
    test('ref to object', () => {
      const resolved = resolveBranchRef(obj);
      expect(resolved).toBeInstanceOf(BranchRefObject);
    });

    test('object to object', () => {
      const resolved = resolveBranchRef(obj);
      expect(resolved).toBeInstanceOf(BranchRefObject);
      expect(resolved, 'Resolved ref object should reference same object').toBe(
        obj,
      );
    });
  });

  describe('copyFrom', () => {
    test('from ref', () => {
      const copy = BranchRefObject.copyFrom(ref);
      expect(copy).toBeInstanceOf(BranchRefObject);
    });

    test('from object', () => {
      const copy = BranchRefObject.copyFrom(obj);
      expect(copy).toBeInstanceOf(BranchRefObject);
      expect(copy, 'Copy should not reference same object').not.toBe(obj);
    });
  });
});
