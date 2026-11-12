import { OnlyOneRequired } from '@/utils/types';
/** Either an object of fields or a class instance that refer to a user */
export type UserRef = UserRefObject | OnlyOneRequired<UserFields>;
/**
 * Resolves a user ref, which may either be an object of fields or a class instance, to a class instance
 *
 * @param userRef The user ref
 * @returns A class instance for a user
 */
export declare function resolveUserRef(userRef: UserRef): UserRefObject;
/** An object of fields that refer to a user */
export type UserFields = {
    id: string;
    githubUsername: string;
};
/**
 * An object constructed from {@linkcode UserFields} that provides utility methods for delaying data fetching until the
 * last possible moment.
 */
export declare class UserRefObject {
    #private;
    constructor(fields: OnlyOneRequired<UserFields>);
    getId(): Promise<UserFields['id']>;
    getGitHubUsername(): Promise<UserFields['githubUsername']>;
}
//# sourceMappingURL=UserRef.d.ts.map