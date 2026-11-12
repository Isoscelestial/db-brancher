import { OnlyOneRequired } from '@/utils/types';

/** Either an object of fields or a class instance that refer to a user */
export type UserRef = UserRefObject | OnlyOneRequired<UserFields>;

/**
 * Resolves a user ref, which may either be an object of fields or a class instance, to a class instance
 *
 * @param userRef The user ref
 * @returns A class instance for a user
 */
export function resolveUserRef(userRef: UserRef): UserRefObject {
  return userRef instanceof UserRefObject
    ? userRef
    : new UserRefObject(userRef);
}

/** An object of fields that refer to a user */
export type UserFields = {
  id: string;
  githubUsername: string;
};

/**
 * An object constructed from {@linkcode UserFields} that provides utility methods for delaying data fetching until the
 * last possible moment.
 */
export class UserRefObject {
  #fields: OnlyOneRequired<UserFields>;

  constructor(fields: OnlyOneRequired<UserFields>) {
    this.#fields = fields;
  }

  async getId(): Promise<UserFields['id']> {
    const fields = this.#fields;
    if (fields.id) {
      return fields.id;
    } else {
      // TODO: Search user database using user's GitHub username and return their id
      throw new Error(
        'Not implemented: Identifying a user with their GitHub username',
      );
    }
  }

  async getGitHubUsername(): Promise<UserFields['githubUsername']> {
    const fields = this.#fields;
    if (fields.githubUsername) {
      return fields.githubUsername;
    } else {
      // TODO: Search user database using user's ID and return their GitHub username
      throw new Error('Not implemented: Identifying a user with their ID');
    }
  }
}
