export interface CreateAdvisorAccountInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Creates and manages the login account behind an advisor, so the use cases
 * don't depend on Better Auth.
 */
export abstract class AdvisorAccountPort {
  /** Creates the user with the ASESOR role and returns its id. */
  abstract createAccount(input: CreateAdvisorAccountInput): Promise<number>;
  /** Signs the user out of every device. */
  abstract revokeSessions(userId: number): Promise<void>;
}
