import { UserRole } from '../../auth/domain/user-role.enum.js';

export interface UserProps {
  id: number;
  name: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  zoneId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A platform user (admin, regional director or advisor) as seen by the
 * user administration screens. Accounts are created through Better Auth.
 */
export class User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly role: UserRole;
  readonly zoneId: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.emailVerified = props.emailVerified;
    this.role = props.role;
    this.zoneId = props.zoneId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
