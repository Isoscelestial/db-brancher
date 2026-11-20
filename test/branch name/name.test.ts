import { dev } from '@/utils/templates';

describe('Generate dev branch names', () => {
  test('username', () => {
    expect(dev('username')).toEqual('dev/username');
    expect(dev('name')).toEqual('dev/name');
    expect(dev('name', undefined)).toEqual('dev/name');
    expect(dev('name', 0)).toEqual('dev/name');
  });

  test('username, slot', () => {
    expect(dev('name', 1)).toEqual('dev/name#1');
    expect(dev('name', 2)).toEqual('dev/name#2');
    expect(dev('name', [1])).toEqual('dev/name#1');
    expect(dev('name', [1, 2])).toEqual('dev/name#1-2');
    expect(dev('name', [1, 2, 3])).toEqual('dev/name#1-2-3');
  });

  test('Catch invalid slots', () => {
    expect(() => dev('name', -1)).toThrow();
    expect(() => dev('name', 0.1)).toThrow();
    expect(() => dev('name', [-1])).toThrow();
    expect(() => dev('name', [0.1])).toThrow();
    expect(() => dev('name', [1, -2])).toThrow();
    expect(() => dev('name', [1, 0.2])).toThrow();
  });

  test('username, note (or lack thereof)', () => {
    expect(dev('name', undefined, 'note')).toEqual('dev/name');
    expect(dev('name', undefined, 'multi-word note')).toEqual('dev/name');
    expect(dev('name', 0, 'multi-word note')).toEqual('dev/name');
  });

  test('username, slot, note', () => {
    expect(dev('name', 1, 'foo')).toEqual('dev/name#1 foo');
    expect(dev('name', 2, 'foo bar')).toEqual('dev/name#2 foo bar');
    expect(dev('name', [3], 'foo')).toEqual('dev/name#3 foo');
    expect(dev('name', [4], 'foo bar')).toEqual('dev/name#4 foo bar');
    expect(dev('name', [5, 6], 'foo')).toEqual('dev/name#5-6 foo');
    expect(dev('name', [7, 8], 'foo bar')).toEqual('dev/name#7-8 foo bar');
  });
});
