export type OnlyOneRequired<T> = {
    [K in keyof T]: {
        [P in K]: T[P];
    } & {
        [P in Exclude<keyof T, K>]?: T[P] | undefined;
    };
}[keyof T];
//# sourceMappingURL=types.d.ts.map