/**
 * Resolves a user ref, which may either be an object of fields or a class instance, to a class instance
 *
 * @param userRef The user ref
 * @returns A class instance for a user
 */
export function resolveUserRef(userRef) {
    return userRef instanceof UserRefObject
        ? userRef
        : new UserRefObject(userRef);
}
/**
 * An object constructed from {@linkcode UserFields} that provides utility methods for delaying data fetching until the
 * last possible moment.
 */
export class UserRefObject {
    #fields;
    constructor(fields) {
        this.#fields = fields;
    }
    async getId() {
        const fields = this.#fields;
        if (fields.id) {
            return fields.id;
        }
        else {
            // TODO: Search user database using user's GitHub username and return their id
            throw new Error('Not implemented: Identifying a user with their GitHub username');
        }
    }
    async getGitHubUsername() {
        const fields = this.#fields;
        if (fields.githubUsername) {
            return fields.githubUsername;
        }
        else {
            // TODO: Search user database using user's ID and return their GitHub username
            throw new Error('Not implemented: Identifying a user with their ID');
        }
    }
}
