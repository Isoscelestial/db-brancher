export type OnlyOneRequired<T> = {
  [K in keyof T]: {
    [P in K]: T[P];
  } & {
    [P in Exclude<keyof T, K>]?: T[P] | undefined;
  };
}[keyof T];

/**
 * Syntax for how to format the branch's slot in its name.
 *
 * - `"global"` - Uses single unique integer (e.g. `#3`)
 * - `"nested"` - Uses multiple integers to indicate parent-child relationships, where each tier is a unique integer (e.g.
 *   `#2-1`)
 */
export type BranchSlotSyntax = 'global' | 'nested';

/**
 * The slot of a user for which a database branch belongs to.
 *
 * - If `number`, using global slot syntax (e.g. `#3` is `3`)
 * - If `number[]`, using nested slot syntax (e.g. `#1-2` is `[1, 2]`)
 */
export type BranchSlot<
  Syntax extends BranchSlotSyntax | undefined = undefined,
> = Syntax extends 'global'
  ? number
  : Syntax extends 'nested'
    ? number[]
    : number | number[];
